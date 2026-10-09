import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import pg from "pg";

const emptySnapshot = () => ({ version: 1, rooms: [] });

export async function createStorage(options = {}) {
  const databaseUrl = options.databaseUrl ?? process.env.DATABASE_URL;
  if (options.dataFile === false && !databaseUrl) {
    return {
      kind: "memory",
      load: async () => emptySnapshot(),
      save: async () => {},
      check: async () => {},
      close: async () => {},
    };
  }
  if (databaseUrl)
    return createPostgresStorage(databaseUrl, process.env.PGSSLMODE);

  const configuredFile = options.dataFile || process.env.POKER_DATA_FILE;
  if (process.env.NODE_ENV === "production" && !configuredFile) {
    throw new Error(
      "Set DATABASE_URL for PostgreSQL, or POKER_DATA_FILE on a persistent volume. Production cannot use temporary container storage.",
    );
  }
  const file = configuredFile || resolve(options.root, ".data/rooms.json");
  return {
    kind: "file",
    async load() {
      try {
        return JSON.parse(await readFile(file, "utf8"));
      } catch (error) {
        if (error.code === "ENOENT") return emptySnapshot();
        throw new Error(
          "Cannot read room recovery file. Preserve it before replacing it.",
          { cause: error },
        );
      }
    },
    async save(snapshot) {
      await mkdir(dirname(file), { recursive: true });
      await writeFile(`${file}.tmp`, JSON.stringify(snapshot), {
        mode: 0o600,
        flush: true,
      });
      await rename(`${file}.tmp`, file);
    },
    check: async () => {},
    close: async () => {},
  };
}

async function createPostgresStorage(connectionString, sslMode) {
  let url;
  try {
    url = new URL(connectionString);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error();
  } catch {
    throw new Error("DATABASE_URL must be a PostgreSQL connection URI.");
  }
  // Keep the explicit TLS policy even when the provider's URI has sslmode=require.
  if (sslMode) url.searchParams.set("sslmode", sslMode);
  // A new deployment claims the snapshot. Conditional writes prevent an old
  // process from overwriting it while Northflank replaces the container.
  const owner = randomUUID();
  const client = new pg.Client({
    connectionString: url.href,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
    statement_timeout: 5000,
    keepAlive: true,
    application_name: "pixel-poker",
  });
  let connectionError;
  client.on("error", (error) => {
    connectionError = error;
  });
  const query = async (sql, values) => {
    if (connectionError) throw connectionError;
    return client.query(sql, values);
  };
  try {
    await client.connect();
    await query(`CREATE TABLE IF NOT EXISTS poker_state (
      id integer PRIMARY KEY CHECK (id = 1),
      owner uuid NOT NULL,
      snapshot jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`);
  } catch (error) {
    await client.end().catch(() => {});
    throw new Error(
      "Cannot connect to the poker database. Check DATABASE_URL, network access and TLS settings.",
      { cause: error },
    );
  }
  const requireOwnership = (result) => {
    if (!result.rowCount) {
      const error = new Error(
        "Another game-server deployment has taken over. Run only one instance.",
      );
      error.code = "SERVER_REPLACED";
      throw error;
    }
  };
  return {
    kind: "postgres",
    async load() {
      const result = await query(
        `INSERT INTO poker_state (id, owner, snapshot)
        VALUES (1, $1, $2::jsonb)
        ON CONFLICT (id) DO UPDATE SET owner = EXCLUDED.owner
        RETURNING snapshot`,
        [owner, JSON.stringify(emptySnapshot())],
      );
      return result.rows[0].snapshot;
    },
    async save(snapshot) {
      const result = await query(
        `UPDATE poker_state SET snapshot = $1::jsonb, updated_at = now()
        WHERE id = 1 AND owner = $2`,
        [JSON.stringify(snapshot), owner],
      );
      requireOwnership(result);
    },
    async check() {
      requireOwnership(
        await query("SELECT id FROM poker_state WHERE id = 1 AND owner = $1", [
          owner,
        ]),
      );
    },
    close: () => client.end(),
  };
}
