import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { randomBytes, randomUUID, createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PokerGame } from "../shared/engine.js";
import { chooseBotAction } from "../shared/bot.js";
import { createStorage } from "./storage.js";
import {
  AVATARS,
  validateProfile,
  validateSettings,
} from "../shared/settings.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hash = (token) => createHash("sha256").update(token).digest("hex");
const validToken = (token) =>
  typeof token === "string" && /^[a-zA-Z0-9-]{32,128}$/.test(token);
const BOT_NAMES = ["Mochi", "Jinx", "Clover", "Miso", "Nova", "Pip", "Orbit"];
const REACTIONS = ["gg", "nice", "wow", "thinking", "unlucky", "hello"];

export async function createPokerServer(options = {}) {
  const app = express();
  const httpServer = createServer(app);
  const production =
    options.production ?? process.env.NODE_ENV === "production";
  const allowedOrigins = (options.clientUrl ?? process.env.CLIENT_URL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((origin) => {
      const url = new URL(origin);
      if (
        !/^https?:$/.test(url.protocol) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== "/"
      )
        throw new Error(
          "CLIENT_URL must contain exact http(s) origins, separated by commas.",
        );
      return url.origin;
    });
  const originAllowed = (origin, request) => {
    if (!origin) return true;
    try {
      const url = new URL(origin);
      if (allowedOrigins.includes(origin) || url.host === request.headers.host)
        return true;
      return (
        !production &&
        /^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(
          url.hostname,
        )
      );
    } catch {
      return false;
    }
  };
  const io = new Server(httpServer, {
    maxHttpBufferSize: 16384,
    cors: {
      origin: (origin, callback) =>
        callback(
          null,
          !origin || allowedOrigins.includes(origin) || !production,
        ),
    },
    allowRequest: (request, callback) =>
      callback(null, originAllowed(request.headers.origin, request)),
  });
  const rooms = new Map();
  const storage =
    options.storage || (await createStorage({ ...options, root }));
  const showdownMs = options.showdownMs ?? 8000;
  const botMs = options.botMs ?? 1000;
  const turnMs = options.turnMs;
  let closing = false;
  let failed = false;
  let closePromise;
  let operations = Promise.resolve();
  let dirty = false;
  const pendingBroadcasts = new Set();
  const unavailable =
    "The game server is reconnecting. Please wait for your table to return.";

  function serialize() {
    const data = [...rooms.values()].map((room) => {
      const { timer: _timer, requestCache: _cache, ...rest } = room;
      return {
        ...rest,
        players: room.players.map(({ socketId: _socket, ...p }) => p),
        game: room.game?.serialize() || null,
      };
    });
    return { version: 1, rooms: data };
  }

  try {
    const saved = await storage.load();
    if (saved.version !== 1 || !Array.isArray(saved.rooms))
      throw new Error("Unsupported snapshot format");
    for (const value of saved.rooms) {
      if (Date.now() - value.updatedAt > 24 * 60 * 60 * 1000) continue;
      const room = {
        ...value,
        players: value.players.map((p) => ({
          ...p,
          connected: !!p.isBot,
          socketId: null,
        })),
        game: value.game ? PokerGame.restore(value.game) : null,
        timer: null,
        requestCache: new Map(),
        deadline: null,
        nextHandAt: null,
      };
      room.game?.assertChips();
      rooms.set(room.code, room);
    }
  } catch (error) {
    await storage.close();
    throw new Error(
      "Cannot restore poker rooms. Preserve recovery data before replacing it.",
      { cause: error },
    );
  }

  function fail(error) {
    if (failed || closing) return;
    failed = true;
    rooms.forEach((room) => clearTimeout(room.timer));
    // Never expose database errors or credentials to a browser.
    console.error(
      "Room persistence failed; stopping game actions.",
      error.code || error.name,
    );
    options.onFatal?.(error);
    // Closing the transport makes Socket.IO reconnect automatically.
    for (const socket of io.sockets.sockets.values()) socket.conn.close();
  }
  function runOperation(handler) {
    const operation = operations.then(async () => {
      if (closing || failed) throw new Error(unavailable);
      dirty = false;
      pendingBroadcasts.clear();
      const result = await handler();
      if (dirty) {
        try {
          await storage.save(serialize());
        } catch (error) {
          fail(error);
          throw new Error(unavailable);
        }
      }
      if (failed) throw new Error(unavailable);
      pendingBroadcasts.forEach(broadcast);
      return result;
    });
    operations = operation.catch(() => {});
    return operation;
  }
  function background(handler) {
    void runOperation(handler).catch((error) => {
      if (!closing && !failed) fail(error);
    });
  }

  function publicRoom(room) {
    return {
      code: room.code,
      hostId: room.hostId,
      settings: room.settings,
      createdAt: room.createdAt,
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isBot: p.isBot,
        connected: p.connected,
        ready: p.ready,
      })),
      chat: room.chat,
    };
  }
  function snapshot(room, id) {
    return {
      room: publicRoom(room),
      game: room.game
        ? {
            ...room.game.view(id),
            deadline: room.deadline,
            nextHandAt: room.nextHandAt,
          }
        : null,
      playerId: id,
      serverTime: Date.now(),
    };
  }
  function broadcast(room) {
    for (const player of room.players) {
      if (player.connected && player.socketId)
        io.to(player.socketId).emit("snapshot", snapshot(room, player.id));
    }
  }
  function connectedHumans(room) {
    return room.players.filter((p) => p.connected && !p.isBot);
  }
  function schedule(room) {
    clearTimeout(room.timer);
    room.timer = null;
    room.deadline = null;
    room.nextHandAt = null;
    if (!room.game || !connectedHumans(room).length || closing) return;
    const game = room.game;
    const revision = game.revision;
    if (game.street === "showdown") {
      room.nextHandAt = Date.now() + showdownMs;
      room.timer = setTimeout(
        () =>
          background(() => {
            if (
              room.game?.revision !== revision ||
              !connectedHumans(room).length
            )
              return;
            game.startHand();
            changed(room);
          }),
        showdownMs,
      );
    } else if (game.playing) {
      const player = room.players.find(
        (p) => p.id === game.players[game.actor].id,
      );
      const duration = player.isBot
        ? botMs + (options.botMs === undefined ? Math.random() * 900 : 0)
        : (turnMs ?? room.settings.turnSeconds * 1000);
      room.deadline = Date.now() + duration;
      room.timer = setTimeout(
        () =>
          background(() => {
            if (
              room.game?.revision !== revision ||
              !connectedHumans(room).length
            )
              return;
            const legal = game.legalActions(player.id);
            const move = player.isBot
              ? chooseBotAction(game.view(player.id))
              : { action: legal.canCheck ? "check" : "fold" };
            game.act(player.id, move.action, move.amount, revision);
            if (!player.isBot)
              game.log(
                `${player.name} timed out · automatic ${move.action}`,
                "timeout",
              );
            changed(room);
          }),
        duration,
      );
    }
    room.timer?.unref();
  }
  function changed(room, resetTimer = true) {
    room.updatedAt = Date.now();
    if (resetTimer) schedule(room);
    dirty = true;
    pendingBroadcasts.add(room);
  }
  function requireRoom(socket, host = false) {
    const room = rooms.get(socket.data.roomCode);
    if (!room)
      throw new Error("This room is no longer available. Create a new table.");
    const player = room.players.find(
      (p) => p.id === socket.data.playerId && p.socketId === socket.id,
    );
    if (!player) throw new Error("Your seat is connected in another window.");
    if (host && room.hostId !== player.id)
      throw new Error("Only the host can do that.");
    return { room, player };
  }
  function findSession(token) {
    if (!validToken(token)) return null;
    const digest = hash(token);
    for (const room of rooms.values()) {
      const player = room.players.find((p) => p.tokenHash === digest);
      if (player) return { room, player };
    }
    return null;
  }
  function attach(socket, room, player) {
    if (player.socketId && player.socketId !== socket.id) {
      const previous = io.sockets.sockets.get(player.socketId);
      if (previous) {
        previous.data = {};
        previous.emit("sessionReplaced");
        previous.disconnect(true);
      }
    }
    socket.data.roomCode = room.code;
    socket.data.playerId = player.id;
    player.socketId = socket.id;
    player.connected = true;
    socket.join(room.code);
    if (!room.players.some((p) => p.id === room.hostId && p.connected))
      room.hostId = player.id;
  }
  function code() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result;
    do {
      result = [...randomBytes(6)]
        .map((n) => alphabet[n % alphabet.length])
        .join("");
    } while (rooms.has(result));
    return result;
  }

  io.use((_socket, next) =>
    next(closing || failed ? new Error(unavailable) : undefined),
  );
  io.on("connection", (socket) => {
    let windowStart = Date.now();
    let requests = 0;
    const socketCache = new Map();
    function on(event, handler) {
      socket.on(event, (payload, ack) => {
        if (typeof ack !== "function") return;
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
          ack({ ok: false, error: "Invalid request." });
          return;
        }
        if (Date.now() - windowStart > 1000) {
          windowStart = Date.now();
          requests = 0;
        }
        if (++requests > 25) {
          ack({ ok: false, error: "Slow down a moment, then try again." });
          return;
        }
        void runOperation(() => {
          const room = rooms.get(socket.data.roomCode);
          const cache = room?.requestCache || socketCache;
          const requestId =
            typeof payload.requestId === "string"
              ? payload.requestId.slice(0, 80)
              : "";
          const key = `${socket.data.playerId || socket.id}:${event}:${requestId}`;
          if (requestId && cache.has(key)) {
            return cache.get(key);
          }
          const response = { ok: true, ...handler(payload) };
          if (requestId) {
            cache.set(key, response);
            if (cache.size > 200) cache.delete(cache.keys().next().value);
          }
          return response;
        }).then(ack, (error) => ack({ ok: false, error: error.message }));
      });
    }

    on("room:create", ({ profile, settings, token }) => {
      if (socket.data.roomCode)
        throw new Error("Leave your current room first.");
      if (!validToken(token))
        throw new Error("Invalid session. Refresh and try again.");
      const existing = findSession(token);
      if (existing) {
        attach(socket, existing.room, existing.player);
        changed(existing.room, !existing.room.timer);
        return snapshot(existing.room, existing.player.id);
      }
      if (rooms.size >= 500)
        throw new Error(
          "The server has reached its room limit. Try again later.",
        );
      const player = {
        ...validateProfile(profile),
        id: randomUUID(),
        tokenHash: hash(token),
        isBot: false,
        ready: true,
      };
      const room = {
        code: code(),
        hostId: player.id,
        settings: validateSettings(settings),
        players: [player],
        game: null,
        chat: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        requestCache: new Map(),
        timer: null,
        deadline: null,
        nextHandAt: null,
      };
      rooms.set(room.code, room);
      attach(socket, room, player);
      changed(room);
      return snapshot(room, player.id);
    });
    on("room:join", ({ code: roomCode, profile, token }) => {
      if (socket.data.roomCode)
        throw new Error("Leave your current room first.");
      if (!validToken(token))
        throw new Error("Invalid session. Refresh and try again.");
      const existing = findSession(token);
      if (existing) {
        attach(socket, existing.room, existing.player);
        changed(existing.room, !existing.room.timer);
        return snapshot(existing.room, existing.player.id);
      }
      const room = rooms.get(
        typeof roomCode === "string" ? roomCode.trim().toUpperCase() : "",
      );
      if (!room)
        throw new Error("Room not found. Check the six-character code.");
      if (room.game)
        throw new Error(
          "That table is playing. Join when the host opens a new lobby.",
        );
      if (room.players.length >= room.settings.maxPlayers)
        throw new Error("That table is full.");
      const validated = validateProfile(profile);
      if (
        room.players.some(
          (p) => p.name.toLowerCase() === validated.name.toLowerCase(),
        )
      )
        throw new Error("That name already has a seat. Try another.");
      const player = {
        ...validated,
        id: randomUUID(),
        tokenHash: hash(token),
        isBot: false,
        ready: false,
      };
      room.players.push(player);
      attach(socket, room, player);
      changed(room);
      return snapshot(room, player.id);
    });
    on("room:resume", ({ token }) => {
      const session = findSession(token);
      if (!session)
        throw new Error(
          "Your previous table has closed. You can start a new one.",
        );
      if (
        socket.data.roomCode &&
        (socket.data.roomCode !== session.room.code ||
          socket.data.playerId !== session.player.id)
      )
        throw new Error("Leave your current room first.");
      attach(socket, session.room, session.player);
      changed(session.room, !session.room.timer);
      return snapshot(session.room, session.player.id);
    });
    on("room:sync", () => {
      const { room, player } = requireRoom(socket);
      return snapshot(room, player.id);
    });
    on("room:configure", ({ settings }) => {
      const { room } = requireRoom(socket, true);
      if (room.game) throw new Error("Settings are locked during the game.");
      const next = validateSettings({ ...room.settings, ...settings });
      if (next.maxPlayers < room.players.length)
        throw new Error("There are already more players at this table.");
      room.settings = next;
      room.players.forEach((p) => {
        p.ready = p.isBot || p.id === room.hostId;
      });
      changed(room);
    });
    on("room:ready", ({ ready }) => {
      const { room, player } = requireRoom(socket);
      if (room.game || typeof ready !== "boolean")
        throw new Error("Cannot change readiness now.");
      player.ready = ready;
      changed(room);
    });
    on("room:bot", () => {
      const { room } = requireRoom(socket, true);
      if (room.game || room.players.length >= room.settings.maxPlayers)
        throw new Error("No open seats for a bot.");
      const name =
        BOT_NAMES.find((n) => !room.players.some((p) => p.name === n)) ||
        `Bot ${room.players.length}`;
      room.players.push({
        id: randomUUID(),
        name,
        avatar: AVATARS[(room.players.length + 1) % AVATARS.length],
        isBot: true,
        connected: true,
        ready: true,
      });
      changed(room);
    });
    on("room:removeBot", ({ id }) => {
      const { room } = requireRoom(socket, true);
      if (room.game) throw new Error("A game is already running.");
      room.players = room.players.filter((p) => p.id !== id || !p.isBot);
      changed(room);
    });
    on("room:removeAway", ({ id }) => {
      const { room } = requireRoom(socket, true);
      if (room.game) throw new Error("Seats stay reserved during the game.");
      const player = room.players.find((p) => p.id === id);
      if (!player || player.connected || player.isBot)
        throw new Error("Only disconnected lobby seats can be cleared.");
      room.players = room.players.filter((p) => p.id !== id);
      changed(room);
    });
    on("game:start", () => {
      const { room } = requireRoom(socket, true);
      if (room.game) throw new Error("A game is already running.");
      if (room.players.length < 2)
        throw new Error("Invite a friend or add a bot first.");
      if (room.players.some((p) => !p.connected || !p.ready))
        throw new Error("Everyone needs to be connected and ready.");
      room.game = new PokerGame(room.players, room.settings);
      changed(room);
    });
    on("game:action", ({ action, amount, revision }) => {
      const { room, player } = requireRoom(socket);
      if (!room.game) throw new Error("The game has not started.");
      if (!Number.isSafeInteger(revision))
        throw new Error("Missing table revision. Refresh your table.");
      room.game.act(player.id, action, amount, revision);
      changed(room);
    });
    on("game:next", ({ revision }) => {
      const { room } = requireRoom(socket, true);
      if (
        !room.game ||
        room.game.street !== "showdown" ||
        room.game.revision !== revision
      )
        throw new Error("The next hand is not ready yet.");
      room.game.startHand();
      changed(room);
    });
    on("game:rematch", () => {
      const { room } = requireRoom(socket, true);
      if (room.game?.street !== "finished")
        throw new Error("Finish the game before starting a rematch.");
      room.game = null;
      room.players = room.players.filter((p) => p.connected);
      room.players.forEach((p) => {
        p.ready = p.isBot || p.id === room.hostId;
      });
      changed(room);
    });
    on("room:chat", ({ text }) => {
      const { room, player } = requireRoom(socket);
      if (Date.now() - (player.lastChatAt || 0) < 700)
        throw new Error("Give the table a moment to read that.");
      if (typeof text !== "string" || !text.trim() || text.length > 240)
        throw new Error("Messages can be 1–240 characters.");
      player.lastChatAt = Date.now();
      room.chat.push({
        id: randomUUID(),
        playerId: player.id,
        name: player.name,
        text: text.trim().replace(/[\p{C}]/gu, ""),
        at: Date.now(),
      });
      room.chat = room.chat.slice(-60);
      changed(room, false);
    });
    on("room:reaction", ({ reaction }) => {
      const { room, player } = requireRoom(socket);
      if (!REACTIONS.includes(reaction)) throw new Error("Unknown reaction.");
      if (Date.now() - (player.lastReactionAt || 0) < 2000)
        throw new Error("Give that reaction a moment.");
      player.lastReactionAt = Date.now();
      io.to(room.code).emit("reaction", {
        playerId: player.id,
        reaction,
        at: Date.now(),
      });
    });
    on("room:leave", () => {
      const { room, player } = requireRoom(socket);
      player.connected = false;
      player.socketId = null;
      // Running seats remain reclaimable; never remove an all-in player's pot eligibility.
      if (!room.game)
        room.players = room.players.filter((p) => p.id !== player.id);
      socket.leave(room.code);
      socket.data = {};
      if (room.hostId === player.id)
        room.hostId =
          connectedHumans(room)[0]?.id ||
          room.players.find((p) => !p.isBot)?.id;
      if (!room.players.some((p) => !p.isBot)) {
        clearTimeout(room.timer);
        rooms.delete(room.code);
        dirty = true;
      } else changed(room, !connectedHumans(room).length);
    });
    socket.on("disconnect", () =>
      background(() => {
        const room = rooms.get(socket.data.roomCode);
        const player = room?.players.find(
          (p) => p.id === socket.data.playerId && p.socketId === socket.id,
        );
        if (!player) return;
        player.connected = false;
        player.socketId = null;
        if (room.hostId === player.id)
          room.hostId = connectedHumans(room)[0]?.id || player.id;
        changed(room, !connectedHumans(room).length);
      }),
    );
  });

  const cleanup = setInterval(
    () =>
      background(() => {
        let removed = false;
        for (const [key, room] of rooms) {
          if (
            !connectedHumans(room).length &&
            Date.now() - room.updatedAt > 24 * 60 * 60 * 1000
          ) {
            clearTimeout(room.timer);
            rooms.delete(key);
            removed = true;
          }
        }
        if (removed) dirty = true;
      }),
    60000,
  );
  cleanup.unref();
  const storageProbe = setInterval(
    () =>
      background(async () => {
        try {
          await storage.check();
        } catch (error) {
          fail(error);
        }
      }),
    options.storageProbeMs ?? 10000,
  );
  storageProbe.unref();
  app.disable("x-powered-by");
  app.get("/api/health", (_, response) =>
    response.json({ ok: true, version: "2.0.0" }),
  );
  app.get("/api/ready", (_, response) => {
    const ok = !closing && !failed;
    response
      .set("Cache-Control", "no-store")
      .status(ok ? 200 : 503)
      .json({ ok, storage: storage.kind });
  });
  app.use(express.static(resolve(root, "dist")));
  app.get("/{*path}", (_request, response) => {
    if (existsSync(resolve(root, "dist/index.html")))
      response.sendFile(resolve(root, "dist/index.html"));
    else
      response.status(404).json({
        error: "Frontend not built. Run npm run dev or npm run build.",
      });
  });
  return {
    app,
    io,
    httpServer,
    rooms,
    close: () => {
      if (closePromise) return closePromise;
      closing = true;
      clearInterval(cleanup);
      clearInterval(storageProbe);
      rooms.forEach((room) => clearTimeout(room.timer));
      closePromise = (async () => {
        await operations;
        await new Promise((resolveClose) => io.close(resolveClose));
        await storage.close();
      })();
      return closePromise;
    },
  };
}
