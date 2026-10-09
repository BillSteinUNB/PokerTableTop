# Vercel + Northflank setup

Vercel serves the frontend. Browsers connect directly to the Northflank Node server for multiplayer. PostgreSQL on Northflank stores room recovery data. Friends use the Vercel link; they don't need accounts on either host.

## What you need

- This repository pushed to GitHub, GitLab, or another Git provider supported by both hosts. Commit the code, root lockfile, Dockerfile, and `vercel.json`; leave `.env`, `.data`, and `output` private.
- Vercel and Northflank accounts connected to that repository.
- One Northflank service and one PostgreSQL addon in the same project/region.

As checked on October 9, 2026, Northflank's [Sandbox tier](https://northflank.com/pricing) includes two always-on services and one free database. Select the resources marked free in the dashboard. Northflank requires a payment method for verification even for free resources; see its [billing documentation](https://northflank.com/docs/v1/application/billing/pricing-on-northflank). Vercel's Hobby plan is suitable for this personal frontend. No custom domain is required.

## 1. Create the database on Northflank

1. Create a project and choose a region near your group.
2. Add a **PostgreSQL** addon using the free allocation. PostgreSQL 17 is used in CI; newer supported versions should also work.
3. Enable **TLS**. Keep the database private, accessible within the project.
4. Create a runtime secret group linked to this addon. Alias its internal, direct primary **`POSTGRES_URI`** secret to **`DATABASE_URL`**. Apply the group to the game service created below. Use the normal database user, not the admin URI or a connection pooler.

The app creates its `poker_state` table automatically. There is no manual migration command. This is a fresh hosted game environment: local `.data/rooms.json` rooms are not imported automatically.

References: [PostgreSQL addon setup](https://northflank.com/docs/v1/application/databases-and-persistence/deploy-databases-on-northflank/deploy-postgresql-on-northflank), [private access and TLS](https://northflank.com/docs/v1/application/databases-and-persistence/access-a-database).

## 2. Create the game service on Northflank

Create a **combined service** from the repository so Northflank builds and runs it.

| Setting                       | Value                                           |
| ----------------------------- | ----------------------------------------------- |
| Repository branch             | The branch containing these changes             |
| Build method                  | Dockerfile                                      |
| Build context                 | Repository root (`/`)                           |
| Dockerfile                    | `/Dockerfile`                                   |
| Runtime command               | Leave the image default: `node server/index.js` |
| Instances                     | **1**, with autoscaling disabled                |
| Compute                       | Free Sandbox service allocation                 |
| Public port                   | **3001**, HTTP protocol                         |
| HTTP readiness/liveness check | `/api/ready` on port 3001                       |

Add these **runtime** variables and the database secret group:

| Variable       | Value                                                        |
| -------------- | ------------------------------------------------------------ |
| `NODE_ENV`     | `production`                                                 |
| `PORT`         | `3001`                                                       |
| `DATABASE_URL` | Linked internal `POSTGRES_URI` secret from step 1            |
| `PGSSLMODE`    | `verify-full`                                                |
| `CLIENT_URL`   | Your exact Vercel production origin, once step 3 supplies it |

You can leave `CLIENT_URL` unset for the first server deployment, then add it in step 4. Database secrets belong in the runtime environment only. The Docker build runs lint/tests and builds the client without production credentials.

Enable public access for port 3001. Northflank supplies an HTTPS address ending in `code.run`; copy the **origin only**, such as `https://your-game-server.code.run`. Northflank handles HTTPS and WebSocket upgrades. Do not append `:3001` or `/socket.io` to the public address.

Open `https://YOUR-SERVER.code.run/api/ready`. It should return:

```json
{ "ok": true, "storage": "postgres" }
```

The server refuses production startup without `DATABASE_URL` or an explicitly configured persistent file. An incorrect database URL fails startup rather than falling back to temporary storage.

Reference: [Northflank networking](https://northflank.com/docs/v1/application/network/networking-on-northflank).

## 3. Deploy the frontend on Vercel

Import the same repository into Vercel. Use the **repository root**, not `src` or `server`. The included `vercel.json` sets:

| Setting          | Value                             |
| ---------------- | --------------------------------- |
| Framework        | Vite                              |
| Install command  | `npm ci`                          |
| Build command    | `npm run build`                   |
| Output directory | `dist`                            |
| Node version     | 24.x (select in project settings) |

Before deploying, add this **Production** environment variable:

```text
VITE_SERVER_URL=https://YOUR-SERVER.code.run
```

This URL is public and is included in the browser bundle. Never put database credentials in Vercel or any variable prefixed with `VITE_`.

Deploy and copy the stable production origin, for example `https://your-project.vercel.app`. Use the production domain rather than a commit-specific preview URL.

Reference: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## 4. Allow the frontend to connect

Set Northflank's `CLIENT_URL` to the Vercel production origin and apply the environment change:

```text
CLIENT_URL=https://your-project.vercel.app
```

Use the full `https://` origin with no path. If you later add a custom domain, include both origins separated by commas. The server normalizes a trailing slash.

For Vercel previews, also set `VITE_SERVER_URL` for the Preview environment and explicitly allow each preview origin on the server. Otherwise use the stable production link for multiplayer. Avoid a wildcard allowlist covering all Vercel projects.

Changing `VITE_SERVER_URL` requires a new **Vercel build/deployment**. Changing `CLIENT_URL` requires a **Northflank restart/deployment**.

## 5. Check a hosted game

1. Open the Vercel link in two separate tabs or devices.
2. Create a room, join with the second player, ready up, and deal a hand.
3. Check that both players see the same board and stacks, but only their own cards.
4. Refresh one tab: it should return to its seat.
5. Restart the Northflank service with those tabs still open. The game should reconnect with the same room, hands, and stacks. The turn clock restarts when a player reconnects.

Keep the same tabs open to retain seat tokens. Closing a tab or clearing browser storage can lose a seat; accounts and cross-device seat recovery are not implemented.

## Recovery and deployments

Every room mutation is saved before a success acknowledgement or updated snapshot is sent. Database failures stop gameplay, fail readiness, and cause the production process to exit so the host can restart it. It resumes from the last saved snapshot; it never silently switches to file storage.

Run **one game-server instance**. During replacement, the new process claims the database snapshot. Conditional writes prevent the old process from overwriting it; the old process disconnects its clients when it detects replacement. This protects room state during deployment overlap, but does not provide horizontal scaling or promise uninterrupted connections. Prefer deploying between games.

PostgreSQL stores the private deck, hands, stacks, bounded chat/hand history, settings, and hashed seat tokens. Keep it private and arrange database backups if you want protection against deleting the addon. Idle rooms expire after 24 hours. Recovery snapshots are not permanent season statistics.

## Troubleshooting

| Symptom                                     | Check                                                                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel build asks for `VITE_SERVER_URL`     | Add the HTTPS server origin to the appropriate Vercel environment, then redeploy.                                                               |
| Homepage works, multiplayer won't connect   | Confirm `/api/ready` returns `ok: true`; compare the browser origin with `CLIENT_URL`; confirm the deployed bundle used the current server URL. |
| Server won't start                          | Confirm the runtime secret group supplies `DATABASE_URL`, both resources share the project, and TLS is enabled. Check Northflank logs.          |
| Server repeatedly reports `SERVER_REPLACED` | Ensure only one service/instance uses this database. Don't point a local server or preview backend at the production database.                  |
| Restart opens an empty lobby                | Check readiness reports `storage: postgres`; verify that the same database is still linked and the room wasn't idle for 24 hours.               |

## Local development and other hosts

`npm run dev` still uses the Vite proxy and `.data/rooms.json` without requiring PostgreSQL. To exercise database recovery locally, use a separate development database and set `DATABASE_URL`. File storage remains available on other hosts via `POKER_DATA_FILE` on a writable persistent volume.

For a single-origin Docker deployment with file recovery:

```sh
docker build -t pixel-poker .
docker volume create pixel-poker-data
docker run --rm -p 3001:3001 -e POKER_DATA_FILE=/app/.data/rooms.json -v pixel-poker-data:/app/.data --name pixel-poker pixel-poker
```

The image runs as the unprivileged Node user. Put an HTTPS reverse proxy in front of it for internet use. The local dev proxy expects server port 3001.

`npm run check` runs lint, the test suite, and the production build. PostgreSQL integration tests run when **`TEST_DATABASE_URL`** points to a disposable test database; they create and clean up an isolated schema. They never use `DATABASE_URL`. CI starts PostgreSQL 17, runs those checks, and builds the Docker image.
