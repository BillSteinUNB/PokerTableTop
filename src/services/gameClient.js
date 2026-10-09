import { io } from "socket.io-client";
import { PokerGame } from "../../shared/engine.js";
import { chooseBotAction } from "../../shared/bot.js";
import { DEFAULT_SETTINGS, validateProfile } from "../../shared/settings.js";

const read = (key) => {
  try {
    return JSON.parse(sessionStorage.getItem(key));
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    value
      ? sessionStorage.setItem(key, JSON.stringify(value))
      : sessionStorage.removeItem(key);
  } catch {
    /* Private browsing may disable storage. */
  }
};
const uid = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(24)), (n) =>
    n.toString(16).padStart(2, "0"),
  ).join("");
const listeners = new Set();
let state = {
  room: null,
  game: null,
  playerId: null,
  mode: null,
  connection: "idle",
  error: null,
  busy: false,
  reactions: {},
  clockOffset: 0,
  parked: !!read("poker-seat"),
};
let socket;
let practice;
let timer;
let connectPromise;
let booted = false;
let detachNetwork = () => {};
function update(value) {
  state = { ...state, ...value };
  listeners.forEach((listener) => listener());
}
function receive(value) {
  update({
    room: value.room,
    game: value.game,
    playerId: value.playerId,
    clockOffset: value.serverTime ? value.serverTime - Date.now() : 0,
    mode: "online",
  });
}
async function request(event, payload = {}) {
  if (!socket?.connected)
    throw new Error(
      "Reconnecting to your table. Actions will be available when you are back.",
    );
  return new Promise((resolve, reject) => {
    socket
      .timeout(6000)
      .emit(event, { ...payload, requestId: uid() }, (error, response) => {
        if (error) {
          if (socket.connected && state.room)
            socket.emit("room:sync", {}, (reply) => {
              if (reply?.ok) receive(reply);
            });
          reject(
            new Error(
              "The reply took too long. Your table is being refreshed; check it before trying again.",
            ),
          );
        } else if (!response?.ok)
          reject(
            new Error(response?.error || "That action could not be completed."),
          );
        else resolve(response);
      });
  });
}
function initSocket() {
  if (socket) return;
  socket = io(import.meta.env.VITE_SERVER_URL || undefined, {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 600,
    reconnectionDelayMax: 5000,
    timeout: 8000,
  });
  socket.on("snapshot", receive);
  const offline = () => {
    if (state.mode !== "online") return;
    socket.disconnect();
    update({ connection: "reconnecting" });
  };
  const online = () => {
    if (state.mode === "online" || read("poker-seat")?.active) {
      connect().catch(() => update({ connection: "reconnecting" }));
    }
  };
  window.addEventListener("offline", offline);
  window.addEventListener("online", online);
  detachNetwork = () => {
    window.removeEventListener("offline", offline);
    window.removeEventListener("online", online);
  };
  socket.on("connect", async () => {
    const seat = read("poker-seat");
    let recovered = true;
    if (seat?.active) {
      update({ connection: "recovering" });
      try {
        receive(await request("room:resume", { token: seat.token }));
      } catch (error) {
        recovered = false;
        if (
          socket.connected &&
          !error.message.includes("reply took too long")
        ) {
          write("poker-seat", null);
          update({
            room: null,
            game: null,
            mode: null,
            parked: false,
            error: error.message,
          });
        }
      }
    }
    if (socket.connected)
      update({
        connection: "connected",
        ...(recovered ? { error: null } : {}),
      });
  });
  socket.on("disconnect", (reason) => {
    if (state.mode === "practice") return;
    update({
      connection: reason === "io client disconnect" ? "idle" : "reconnecting",
    });
  });
  socket.on("connect_error", () => {
    if (state.mode !== "practice")
      update({ connection: state.room ? "reconnecting" : "unavailable" });
  });
  socket.on("sessionReplaced", () => {
    write("poker-seat", null);
    update({
      room: null,
      game: null,
      mode: null,
      parked: false,
      error: "Your seat was opened in another window. Continue playing there.",
    });
  });
  socket.on("reaction", (reaction) => {
    update({
      reactions: { ...state.reactions, [reaction.playerId]: reaction },
    });
  });
}
async function connect() {
  initSocket();
  if (state.connection === "connected" && socket.connected) return;
  if (connectPromise) return connectPromise;
  update({ connection: "connecting", error: null });
  connectPromise = new Promise((resolve, reject) => {
    const stop = () => {
      listeners.delete(check);
      clearTimeout(timeout);
      connectPromise = null;
    };
    const check = () => {
      if (state.connection === "connected") {
        stop();
        resolve();
      } else if (state.connection === "unavailable") {
        stop();
        reject(
          new Error("Server unavailable. Try again or start a practice game."),
        );
      }
    };
    const timeout = setTimeout(() => {
      stop();
      reject(
        new Error(
          "Could not connect to the server. Check your connection and try again.",
        ),
      );
    }, 10000);
    listeners.add(check);
    socket.connect();
  });
  return connectPromise;
}
function practiceUpdate() {
  clearTimeout(timer);
  const view = practice.view("you");
  view.deadline = null;
  view.nextHandAt = null;
  if (practice.street === "showdown") {
    view.nextHandAt = Date.now() + 8000;
    timer = setTimeout(() => {
      practice.startHand();
      practiceUpdate();
    }, 8000);
  } else if (practice.playing && practice.players[practice.actor].isBot) {
    timer = setTimeout(
      () => {
        const player = practice.players[practice.actor];
        const move = chooseBotAction(practice.view(player.id));
        practice.act(player.id, move.action, move.amount);
        practiceUpdate();
      },
      1000 + Math.random() * 800,
    );
  }
  write("poker-practice", { game: practice.serialize(), room: state.room });
  update({
    game: view,
    mode: "practice",
    connection: "local",
    clockOffset: 0,
    playerId: "you",
  });
}

export const gameClient = {
  subscribe: (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => state,
  clearError: () => update({ error: null }),
  async run(fn) {
    if (state.busy) return false;
    update({ busy: true, error: null });
    try {
      await fn();
      return true;
    } catch (error) {
      update({ error: error.message });
      return false;
    } finally {
      update({ busy: false });
    }
  },
  boot() {
    if (booted) return;
    booted = true;
    const saved = read("poker-practice");
    if (saved) {
      try {
        practice = PokerGame.restore(saved.game);
        practice.assertChips();
        update({ room: saved.room });
        practiceUpdate();
        return;
      } catch {
        write("poker-practice", null);
      }
    }
    if (read("poker-seat")?.active) gameClient.run(connect);
  },
  async create(profile, settings) {
    await connect();
    const token = uid();
    write("poker-seat", { token, active: true });
    try {
      receive(await request("room:create", { profile, settings, token }));
      update({ parked: true });
    } catch (error) {
      if (!error.message.includes("reply took too long"))
        write("poker-seat", null);
      throw error;
    }
  },
  async join(code, profile) {
    await connect();
    const token = uid();
    write("poker-seat", { token, active: true });
    try {
      receive(await request("room:join", { code, profile, token }));
      update({ parked: true });
    } catch (error) {
      if (!error.message.includes("reply took too long"))
        write("poker-seat", null);
      throw error;
    }
  },
  async resume() {
    const saved = read("poker-seat");
    if (!saved)
      throw new Error("No saved seat on this tab. Join with your room code.");
    await connect();
    receive(await request("room:resume", { token: saved.token }));
    write("poker-seat", { ...saved, active: true });
  },
  practice(profile) {
    socket?.disconnect();
    const players = [
      { ...validateProfile(profile), id: "you" },
      { id: "bot-1", name: "Mochi", avatar: "cat", isBot: true },
      { id: "bot-2", name: "Clover", avatar: "frog", isBot: true },
      { id: "bot-3", name: "Jinx", avatar: "raccoon", isBot: true },
    ];
    practice = new PokerGame(players, DEFAULT_SETTINGS);
    update({
      room: {
        code: "PRACTICE",
        hostId: "you",
        settings: DEFAULT_SETTINGS,
        chat: [],
        players: players.map((p) => ({ ...p, connected: true, ready: true })),
      },
      reactions: {},
    });
    practiceUpdate();
  },
  async leave() {
    if (state.mode === "practice") {
      clearTimeout(timer);
      practice = null;
      write("poker-practice", null);
    } else {
      if (socket?.connected) await request("room:leave");
      const seat = read("poker-seat");
      if (seat && state.game) write("poker-seat", { ...seat, active: false });
      else write("poker-seat", null);
      socket?.disconnect();
    }
    update({
      room: null,
      game: null,
      playerId: null,
      mode: null,
      connection: "idle",
      reactions: {},
      parked: !!read("poker-seat"),
    });
  },
  configure: (settings) => request("room:configure", { settings }),
  ready: (ready) => request("room:ready", { ready }),
  addBot: () => request("room:bot"),
  removeBot: (id) => request("room:removeBot", { id }),
  removeAway: (id) => request("room:removeAway", { id }),
  start: () => request("game:start"),
  async act(action, amount) {
    if (practice && state.mode === "practice") {
      practice.act("you", action, amount, state.game.revision);
      practiceUpdate();
    } else
      await request("game:action", {
        action,
        amount,
        revision: state.game.revision,
      });
  },
  async next() {
    if (state.mode === "practice") {
      practice.startHand();
      practiceUpdate();
    } else await request("game:next", { revision: state.game.revision });
  },
  async rematch() {
    if (state.mode === "practice") gameClient.practice(state.room.players[0]);
    else await request("game:rematch");
  },
  chat: (text) => request("room:chat", { text }),
  async react(reaction) {
    if (state.mode === "practice")
      update({
        reactions: { ...state.reactions, you: { reaction, at: Date.now() } },
      });
    else await request("room:reaction", { reaction });
  },
};

// A transport/engine edit should restore the saved seat, not create duplicate sockets.
if (import.meta.hot) {
  import.meta.hot.accept(() => window.location.reload());
  import.meta.hot.dispose(() => {
    clearTimeout(timer);
    detachNetwork();
    socket?.removeAllListeners();
    socket?.disconnect();
  });
}
