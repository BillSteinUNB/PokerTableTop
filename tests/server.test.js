import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { mkdtempSync, readFileSync, unlinkSync, rmdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { io } from "socket.io-client";
import { createPokerServer } from "../server/server.js";

const token = () => randomBytes(32).toString("hex");
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const request = (socket, event, payload = {}) =>
  new Promise((resolve, reject) =>
    socket
      .timeout(2000)
      .emit(event, payload, (error, response) =>
        error ? reject(error) : resolve(response),
      ),
  );
async function waitFor(predicate, message = "condition", timeout = 2500) {
  const until = Date.now() + timeout;
  while (!predicate()) {
    if (Date.now() > until) throw new Error(`Timed out waiting for ${message}`);
    await pause(10);
  }
}
async function harness(t, options = {}) {
  const server = await createPokerServer({
    dataFile: false,
    databaseUrl: "",
    ...options,
  });
  server.httpServer.listen(0, "127.0.0.1");
  await once(server.httpServer, "listening");
  const url = `http://127.0.0.1:${server.httpServer.address().port}`;
  const clients = [];
  async function client(transport = "websocket", origin) {
    const socket = io(url, {
      forceNew: true,
      transports: [transport],
      reconnection: false,
      extraHeaders: origin ? { Origin: origin } : undefined,
    });
    const value = { socket, token: token(), state: null };
    socket.on("snapshot", (snapshot) => {
      value.state = snapshot;
    });
    clients.push(value);
    await once(socket, "connect");
    return value;
  }
  t.after(async () => {
    clients.forEach((c) => c.socket.disconnect());
    await server.close();
  });
  return { server, url, client };
}
async function setup(t, options = {}) {
  const h = await harness(t, options);
  const a = await h.client(),
    b = await h.client();
  const created = await request(a.socket, "room:create", {
    profile: { name: "Alice", avatar: "fox", chips: 999999, id: "fake" },
    token: a.token,
  });
  assert.equal(created.ok, true);
  a.id = created.playerId;
  const joined = await request(b.socket, "room:join", {
    code: created.room.code.toLowerCase(),
    profile: { name: "Bobby", avatar: "cat" },
    token: b.token,
  });
  assert.equal(joined.ok, true);
  b.id = joined.playerId;
  await request(b.socket, "room:ready", { ready: true });
  return { ...h, a, b, code: created.room.code };
}

test("private room lifecycle, lowercase join, ready gates, safe public snapshots", async (t) => {
  const { a, b, server, code } = await setup(t);
  assert.equal(server.rooms.size, 1);
  assert.equal(a.state.room.players.length, 2);
  const exposed = JSON.stringify(a.state);
  for (const secret of ["tokenHash", "socketId", a.token, b.token, "999999"])
    assert.ok(!exposed.includes(secret));
  assert.notEqual(a.id, "fake");
  assert.equal((await request(b.socket, "game:start")).ok, false);
  await request(b.socket, "room:ready", { ready: false });
  assert.equal((await request(a.socket, "game:start")).ok, false);
  await request(b.socket, "room:ready", { ready: true });
  assert.equal((await request(a.socket, "game:start")).ok, true);
  await waitFor(() => b.state?.game);
  assert.deepEqual(a.state.game.players.find((p) => p.id === b.id).hand, [
    null,
    null,
  ]);
  assert.deepEqual(b.state.game.players.find((p) => p.id === a.id).hand, [
    null,
    null,
  ]);
  assert.ok(
    a.state.game.players.find((p) => p.id === a.id).hand.every(Boolean),
  );
  assert.equal((await request(a.socket, "game:start")).ok, false);
  assert.equal(
    (await request(a.socket, "game:next", { revision: a.state.game.revision }))
      .ok,
    false,
  );
  assert.equal(server.rooms.get(code).game.handNumber, 1);
});

test("new animal and human characters survive online play and seat recovery", async (t) => {
  const { client } = await harness(t);
  const host = await client();
  const guest = await client();
  const created = await request(host.socket, "room:create", {
    profile: { name: "Capy", avatar: "capybara" },
    token: host.token,
  });
  const joined = await request(guest.socket, "room:join", {
    code: created.room.code,
    profile: { name: "Skater", avatar: "skater" },
    token: guest.token,
  });
  assert.equal(created.ok, true);
  assert.equal(joined.ok, true);
  assert.deepEqual(
    joined.room.players.map((player) => player.avatar),
    ["capybara", "skater"],
  );
  await request(guest.socket, "room:ready", { ready: true });
  const started = await request(host.socket, "game:start");
  assert.equal(started.ok, true);
  await waitFor(() => guest.state?.game);
  assert.deepEqual(
    guest.state.game.players.map((player) => player.avatar),
    ["capybara", "skater"],
  );
  const recovered = await client();
  const resumed = await request(recovered.socket, "room:resume", {
    token: guest.token,
  });
  assert.equal(resumed.ok, true);
  assert.equal(
    resumed.game.players.find((player) => player.id === joined.playerId).avatar,
    "skater",
  );
});

test("out-of-turn, missing revision, invalid bets and duplicate action replay", async (t) => {
  const { a, b, server, code } = await setup(t);
  await request(a.socket, "game:start");
  const revision = a.state.game.revision;
  assert.equal(
    (await request(b.socket, "game:action", { action: "fold", revision })).ok,
    false,
  );
  assert.equal(
    (await request(a.socket, "game:action", { action: "call" })).ok,
    false,
  );
  assert.equal(
    (
      await request(a.socket, "game:action", {
        action: "raise",
        amount: -999,
        revision,
      })
    ).ok,
    false,
  );
  const payload = { action: "call", revision, requestId: "one-click" };
  assert.equal((await request(a.socket, "game:action", payload)).ok, true);
  const chips = server.rooms.get(code).game.players[0].chips;
  assert.equal((await request(a.socket, "game:action", payload)).ok, true);
  assert.equal(server.rooms.get(code).game.players[0].chips, chips);
  assert.equal(server.rooms.get(code).game.revision, revision + 1);
  assert.equal(
    (
      await request(a.socket, "game:action", {
        ...payload,
        requestId: "stale-click",
      })
    ).ok,
    false,
  );
});

test("reconnect restores stable seat and private cards; host migrates and timer does not reset", async (t) => {
  const { a, b, client, server, code } = await setup(t);
  await request(a.socket, "game:start");
  const hand = a.state.game.players[0].hand;
  const deadline = server.rooms.get(code).deadline;
  a.socket.disconnect();
  await waitFor(() => b.state.room.hostId === b.id);
  const reconnected = await client();
  const response = await request(reconnected.socket, "room:resume", {
    token: a.token,
  });
  assert.equal(response.ok, true);
  assert.equal(response.playerId, a.id);
  assert.deepEqual(response.game.players[0].hand, hand);
  assert.equal(response.game.deadline, deadline);
  assert.equal(response.room.hostId, b.id);
  assert.equal(response.room.players.length, 2);
  assert.equal(
    (await request(reconnected.socket, "room:resume", { token: token() })).ok,
    false,
  );
});

test("stolen public ids cannot reclaim a seat; a real session supersedes old socket", async (t) => {
  const { a, b, client } = await setup(t);
  assert.equal(
    (await request(a.socket, "room:resume", { token: b.token })).ok,
    false,
    "One socket cannot occupy two seats, even with both session tokens",
  );
  assert.equal(b.socket.connected, true);
  const outsider = await client();
  assert.equal(
    (await request(outsider.socket, "room:resume", { token: a.id })).ok,
    false,
  );
  assert.equal(
    (await request(outsider.socket, "game:start", { playerId: a.id })).ok,
    false,
  );
  const replaced = once(a.socket, "sessionReplaced");
  const resumed = await request(outsider.socket, "room:resume", {
    token: a.token,
  });
  assert.equal(resumed.ok, true);
  await replaced;
  await waitFor(() => !a.socket.connected);
  assert.equal(b.state.room.players.length, 2);
});

test("malformed packets, absent callbacks, capacity and settings are safe", async (t) => {
  const { a, b, client, code } = await setup(t);
  a.socket.emit("room:create", null);
  a.socket.emit("game:action", null);
  assert.equal((await request(a.socket, "game:action", null)).ok, false);
  assert.equal(
    (await request(b.socket, "room:configure", { settings: { maxPlayers: 8 } }))
      .ok,
    false,
  );
  assert.equal(
    (await request(a.socket, "room:configure", { settings: { maxPlayers: 2 } }))
      .ok,
    true,
  );
  const outsider = await client();
  assert.equal(
    (
      await request(outsider.socket, "room:join", {
        code,
        profile: { name: "Third" },
        token: outsider.token,
      })
    ).ok,
    false,
  );
  assert.equal(
    (
      await request(a.socket, "room:configure", {
        settings: { startingChips: 12.5 },
      })
    ).ok,
    false,
  );
  assert.equal((await request(a.socket, "room:bot")).ok, false);
});

test("chat is bounded text and cannot extend a turn timer; reactions broadcast", async (t) => {
  const { a, b, server, code } = await setup(t);
  await request(a.socket, "game:start");
  const deadline = server.rooms.get(code).deadline;
  const chat = "<img src=x onerror=alert(1)>";
  assert.equal((await request(a.socket, "room:chat", { text: chat })).ok, true);
  await waitFor(() => b.state.room.chat.length === 1);
  assert.equal(b.state.room.chat[0].text, chat);
  assert.equal(server.rooms.get(code).deadline, deadline);
  assert.equal(
    (await request(a.socket, "room:chat", { text: "Too fast" })).ok,
    false,
  );
  const reaction = once(b.socket, "reaction");
  assert.equal(
    (await request(a.socket, "room:reaction", { reaction: "gg" })).ok,
    true,
  );
  assert.equal((await reaction)[0].playerId, a.id);
});

test("timeouts check for free, fold to bets, and automatically deal another hand", async (t) => {
  const { a, b } = await setup(t, { turnMs: 120, showdownMs: 150 });
  await request(a.socket, "game:start");
  await request(a.socket, "game:action", {
    action: "call",
    revision: a.state.game.revision,
  });
  await waitFor(
    () => b.state.game.street === "flop",
    "big blind automatic check",
  );
  assert.ok(
    b.state.game.events.some((e) => e.text.includes("automatic check")),
  );
  // First to act on flop is Bobby. Place a bet then let Alice time out.
  const reply = await request(b.socket, "game:action", {
    action: "raise",
    amount: 40,
    revision: b.state.game.revision,
  });
  assert.equal(reply.ok, true);
  await waitFor(() => a.state.game.street === "showdown", "automatic fold");
  assert.ok(a.state.game.events.some((e) => e.text.includes("automatic fold")));
  await waitFor(() => a.state.game.handNumber === 2, "automatic next hand");
});

test("all offline pauses the table, including bot timers, until a real player resumes", async (t) => {
  const { a, b, server, code, client } = await setup(t, { turnMs: 100 });
  await request(a.socket, "game:start");
  const revision = server.rooms.get(code).game.revision;
  a.socket.disconnect();
  b.socket.disconnect();
  await waitFor(() => server.rooms.get(code).deadline === null);
  await pause(180);
  assert.equal(server.rooms.get(code).game.revision, revision);
  const c = await client();
  await request(c.socket, "room:resume", { token: a.token });
  assert.ok(server.rooms.get(code).deadline);
});

test("leaving mid-hand preserves the seat, stack and ability to reconnect", async (t) => {
  const { a, b, server, code } = await setup(t);
  await request(a.socket, "game:start");
  const chips = server.rooms.get(code).game.players[0].chips;
  await request(a.socket, "room:leave");
  assert.equal(server.rooms.get(code).players.length, 2);
  assert.equal(server.rooms.get(code).game.players[0].chips, chips);
  const reply = await request(a.socket, "room:resume", { token: a.token });
  assert.equal(reply.ok, true);
  assert.equal(reply.playerId, a.id);
  assert.equal(reply.room.hostId, b.id);
});

test("a finished game returns to a ready-gated rematch with fresh stacks", async (t) => {
  const { a, b } = await setup(t);
  assert.equal((await request(a.socket, "game:rematch")).ok, false);
  await request(a.socket, "game:start");
  // A tied board may require another hand before one player is eliminated.
  for (let hand = 0; hand < 12 && a.state.game.street !== "finished"; hand++) {
    while (a.state.game.street !== "showdown") {
      const game = a.state.game;
      const actor = game.players[game.actor].id === a.id ? a : b;
      const reply = await request(actor.socket, "game:action", {
        action: "all-in",
        revision: game.revision,
      });
      assert.equal(reply.ok, true);
      await waitFor(() => a.state.game.revision > game.revision);
    }
    const revision = a.state.game.revision;
    assert.equal((await request(a.socket, "game:next", { revision })).ok, true);
    await waitFor(() => a.state.game.revision > revision);
  }
  assert.equal(a.state.game.street, "finished");
  assert.ok(a.state.game.champion);
  assert.equal((await request(b.socket, "game:rematch")).ok, false);
  assert.equal((await request(a.socket, "game:rematch")).ok, true);
  await waitFor(() => a.state.game === null && b.state.game === null);
  assert.equal(b.state.room.players.find((p) => p.id === b.id).ready, false);
  assert.equal((await request(a.socket, "game:start")).ok, false);
  await request(b.socket, "room:ready", { ready: true });
  assert.equal((await request(a.socket, "game:start")).ok, true);
  await waitFor(() => a.state.game?.handNumber === 1);
  assert.equal(a.state.game.history.length, 0);
  for (const player of a.state.game.players) {
    assert.equal(
      player.chips + player.bet,
      a.state.room.settings.startingChips,
    );
  }
});

test("same deployment works over HTTP polling fallback and exposes a health endpoint", async (t) => {
  const h = await harness(t);
  const c = await h.client("polling");
  const reply = await request(c.socket, "room:create", {
    profile: { name: "Polling" },
    token: c.token,
  });
  assert.equal(reply.ok, true);
  const health = await fetch(`${h.url}/api/health`);
  assert.equal((await health.json()).ok, true);
});

test("production permits only the configured frontend over polling and WebSocket", async (t) => {
  const origin = "https://poker-friends.vercel.app";
  const h = await harness(t, { production: true, clientUrl: `${origin}/` });
  for (const transport of ["polling", "websocket"]) {
    const c = await h.client(transport, origin);
    assert.equal(
      (
        await request(c.socket, "room:create", {
          profile: { name: transport },
          token: c.token,
        })
      ).ok,
      true,
    );
    const rejected = io(h.url, {
      transports: [transport],
      reconnection: false,
      extraHeaders: { Origin: "https://unrelated.vercel.app" },
    });
    t.after(() => rejected.disconnect());
    await once(rejected, "connect_error");
    assert.equal(rejected.connected, false);
  }
  const response = await fetch(`${h.url}/socket.io/?EIO=4&transport=polling`, {
    headers: { Origin: origin },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), origin);
  assert.equal(
    (
      await fetch(`${h.url}/socket.io/?EIO=4&transport=polling`, {
        headers: { Origin: "https://unrelated.vercel.app" },
      })
    ).status,
    403,
  );
});

test("actions and snapshots wait for persistence, including simultaneous requests", async (t) => {
  let release;
  let saving = false;
  let durable;
  const storage = {
    kind: "test",
    load: async () => ({ version: 1, rooms: [] }),
    save: async (value) => {
      saving = true;
      await new Promise((resolve) => {
        release = resolve;
      });
      durable = structuredClone(value);
    },
    check: async () => {},
    close: async () => {},
  };
  const h = await harness(t, { storage });
  const c = await h.client();
  let acknowledged = false;
  const pending = request(c.socket, "room:create", {
    profile: { name: "Durable" },
    token: c.token,
  }).then((reply) => {
    acknowledged = true;
    return reply;
  });
  await waitFor(() => saving);
  const sync = request(c.socket, "room:sync");
  await pause(30);
  assert.equal(acknowledged, false);
  assert.equal(c.state, null);
  release();
  assert.equal((await pending).ok, true);
  assert.equal((await sync).room.code, durable.rooms[0].code);
  assert.equal(c.state.room.code, durable.rooms[0].code);
  // Cleanup disconnects may save too; don't leave those waiting on the test.
  storage.save = async () => {};
});

test("failed storage pauses gameplay, fails readiness, and never broadcasts unsaved changes", async (t) => {
  let broken = false;
  let failures = 0;
  const storage = {
    kind: "test",
    load: async () => ({ version: 1, rooms: [] }),
    save: async () => {
      if (broken) throw new Error("private-database-secret");
    },
    check: async () => {},
    close: async () => {},
  };
  const h = await harness(t, {
    storage,
    onFatal: () => {
      failures++;
    },
  });
  const c = await h.client();
  await request(c.socket, "room:create", {
    profile: { name: "Failure" },
    token: c.token,
  });
  assert.equal((await fetch(`${h.url}/api/ready`)).status, 200);
  broken = true;
  const disconnected = once(c.socket, "disconnect");
  // A storage failure closes the transport so the real client reconnects.
  c.socket.emit("room:bot", {}, (reply) => assert.notEqual(reply.ok, true));
  await disconnected;
  assert.equal(c.state.room.players.length, 1);
  assert.equal(failures, 1);
  const readiness = await fetch(`${h.url}/api/ready`);
  assert.equal(readiness.status, 503);
  assert.ok(!(await readiness.text()).includes("secret"));
});

test("restart restores exact deck, chips, cards, sessions and restarts the turn clock", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "pixel-poker-test-"));
  const dataFile = join(directory, "rooms.json");
  // Close the first server before opening the same file in the replacement.
  let first = await createPokerServer({ dataFile, databaseUrl: "" });
  first.httpServer.listen(0, "127.0.0.1");
  await once(first.httpServer, "listening");
  const socket = io(`http://127.0.0.1:${first.httpServer.address().port}`, {
    transports: ["websocket"],
    reconnection: false,
  });
  await once(socket, "connect");
  const secret = token();
  const created = await request(socket, "room:create", {
    profile: { name: "Restart" },
    token: secret,
  });
  await request(socket, "room:bot");
  await request(socket, "game:start");
  const before = first.rooms.get(created.room.code).game.serialize();
  socket.disconnect();
  await first.close();
  first = null;
  assert.ok(
    !readFileSync(dataFile, "utf8").includes(secret),
    "Recovery file stores token hashes, never bearer tokens",
  );
  const second = await createPokerServer({ dataFile, databaseUrl: "" });
  second.httpServer.listen(0, "127.0.0.1");
  await once(second.httpServer, "listening");
  const replacement = io(
    `http://127.0.0.1:${second.httpServer.address().port}`,
    { transports: ["websocket"], reconnection: false },
  );
  t.after(async () => {
    replacement.disconnect();
    await second.close();
    unlinkSync(dataFile);
    rmdirSync(directory);
  });
  await once(replacement, "connect");
  const resumed = await request(replacement, "room:resume", { token: secret });
  assert.equal(resumed.ok, true);
  assert.equal(resumed.playerId, created.playerId);
  assert.deepEqual(
    second.rooms.get(created.room.code).game.serialize(),
    before,
  );
  assert.ok(resumed.game.deadline > Date.now());
});
