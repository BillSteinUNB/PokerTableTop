import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import pg from "pg";
import { io } from "socket.io-client";
import { createPokerServer } from "../server/server.js";
import { createStorage } from "../server/storage.js";

// Explicitly opt into a disposable test database. Never use DATABASE_URL.
const databaseUrl = process.env.TEST_DATABASE_URL;
const request = (socket, event, payload = {}) =>
  new Promise((resolve, reject) => {
    socket
      .timeout(3000)
      .emit(event, payload, (error, result) =>
        error ? reject(error) : resolve(result),
      );
  });

async function scope(t) {
  const admin = new pg.Client({ connectionString: databaseUrl });
  await admin.connect();
  const schema = `poker_test_${randomUUID().replaceAll("-", "")}`;
  await admin.query(`CREATE SCHEMA ${schema}`);
  const url = new URL(databaseUrl);
  url.searchParams.set("options", `-c search_path=${schema}`);
  const servers = [],
    stores = [],
    clients = [];
  t.after(async () => {
    clients.forEach((client) => client.disconnect());
    await Promise.all(servers.map((server) => server.close()));
    await Promise.all(stores.map((store) => store.close()));
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });
  return {
    admin,
    schema,
    async store() {
      const store = await createStorage({ databaseUrl: url.href });
      stores.push(store);
      return store;
    },
    async server(options = {}) {
      const server = await createPokerServer({
        databaseUrl: url.href,
        turnMs: 60000,
        botMs: 60000,
        ...options,
      });
      servers.push(server);
      server.httpServer.listen(0, "127.0.0.1");
      await once(server.httpServer, "listening");
      server.url = `http://127.0.0.1:${server.httpServer.address().port}`;
      return server;
    },
    async client(server) {
      const socket = io(server.url, {
        transports: ["websocket"],
        reconnection: false,
      });
      clients.push(socket);
      await once(socket, "connect");
      return socket;
    },
  };
}

test(
  "PostgreSQL deployment recovery",
  {
    skip: !databaseUrl && "Set TEST_DATABASE_URL to run real PostgreSQL checks",
  },
  async (t) => {
    await t.test(
      "acknowledged state survives replacement without a shutdown save; old process cannot overwrite it",
      async (t) => {
        const db = await scope(t);
        let oldFailed = false;
        const first = await db.server({
          onFatal: () => {
            oldFailed = true;
          },
        });
        const a = await db.client(first),
          b = await db.client(first);
        const tokenA = randomUUID(),
          tokenB = randomUUID();
        const created = await request(a, "room:create", {
          profile: { name: "Alice" },
          token: tokenA,
        });
        const joined = await request(b, "room:join", {
          code: created.room.code,
          profile: { name: "Bobby" },
          token: tokenB,
        });
        await request(b, "room:ready", { ready: true });
        await request(a, "room:chat", { text: "Saved table" });
        await request(a, "game:start");
        const game = first.rooms.get(created.room.code).game;
        const actor = game.players[game.actor].id === created.playerId ? a : b;
        assert.equal(
          (
            await request(actor, "game:action", {
              action: "call",
              revision: game.revision,
            })
          ).ok,
          true,
        );
        const expected = game.serialize();
        const persisted = await db.admin.query(
          `SELECT snapshot FROM ${db.schema}.poker_state`,
        );
        assert.deepEqual(persisted.rows[0].snapshot.rooms[0].game, expected);
        assert.ok(!JSON.stringify(persisted.rows).includes(tokenA));
        // Deliberately keep the old deployment running while its replacement boots.
        const second = await db.server();
        const resumedA = await request(await db.client(second), "room:resume", {
          token: tokenA,
        });
        const resumedB = await request(await db.client(second), "room:resume", {
          token: tokenB,
        });
        assert.equal(resumedA.playerId, created.playerId);
        assert.equal(resumedB.playerId, joined.playerId);
        assert.equal(resumedA.room.chat[0].text, "Saved table");
        assert.deepEqual(
          second.rooms.get(created.room.code).game.serialize(),
          expected,
        );
        assert.deepEqual(
          resumedA.game.players.find((p) => p.id === joined.playerId).hand,
          [null, null],
        );
        const disconnected = once(b, "disconnect");
        b.emit(
          "room:chat",
          { text: "Old deployment must not persist this" },
          () => {},
        );
        await disconnected;
        assert.equal(oldFailed, true);
        assert.equal((await fetch(`${first.url}/api/ready`)).status, 503);
        const after = await db.admin.query(
          `SELECT snapshot FROM ${db.schema}.poker_state`,
        );
        assert.equal(after.rows[0].snapshot.rooms[0].chat.length, 1);
        assert.deepEqual(after.rows[0].snapshot.rooms[0].game, expected);
      },
    );

    await t.test(
      "database write errors stop the server before it confirms or publishes an action",
      async (t) => {
        const db = await scope(t);
        const server = await db.server();
        const client = await db.client(server);
        let lastSnapshot;
        client.on("snapshot", (value) => {
          lastSnapshot = value;
        });
        await request(client, "room:create", {
          profile: { name: "Failure" },
          token: randomUUID(),
        });
        await db.admin.query(
          `ALTER TABLE ${db.schema}.poker_state RENAME TO unavailable_state`,
        );
        const disconnected = once(client, "disconnect");
        client.emit("room:bot", {}, (reply) => assert.notEqual(reply.ok, true));
        await disconnected;
        assert.equal(lastSnapshot.room.players.length, 1);
        assert.equal((await fetch(`${server.url}/api/ready`)).status, 503);
        const durable = await db.admin.query(
          `SELECT snapshot FROM ${db.schema}.unavailable_state`,
        );
        assert.equal(durable.rows[0].snapshot.rooms[0].players.length, 1);
      },
    );

    await t.test(
      "corrupt database recovery fails startup instead of silently creating empty rooms",
      async (t) => {
        const db = await scope(t);
        const store = await db.store();
        await store.load();
        await store.save({ version: 999, rooms: [] });
        await assert.rejects(db.server(), /Cannot restore poker rooms/);
        const saved = await db.admin.query(
          `SELECT snapshot FROM ${db.schema}.poker_state`,
        );
        assert.equal(saved.rows[0].snapshot.version, 999);
      },
    );
  },
);
