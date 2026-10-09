# Pixel Poker

A pixel-art Texas Hold’em game for 2–8 players, with private rooms and offline practice.

## Start playing

Requires **Node.js 22.12+** (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open **http://localhost:3000**. One command starts the frontend and multiplayer server. Create a room, copy the invite link, and have your friends choose a name and ready up. Fill empty seats with house bots if you like. **Practice** plays offline against three bots and gives you unlimited time to act.

For a phone or another computer on the same Wi-Fi, open the **Network** address printed by Vite (for example `http://192.168.1.25:3000`). Open that address yourself before copying an invite: a `localhost` link only works on the computer that created it. Allow Node through your private-network firewall if prompted. No source-code URL edits are necessary.

## What’s in this version

- A custom pixel-art clubhouse, 20 original pixel characters (14 animals and six people), a complete pixel card deck with suit pips and court art, smooth dealing/chip animations, and responsive table layouts.
- A character picker with named previews, category filters, and keyboard navigation. Showdown highlights mark each winner’s best cards, with individual payouts shown below the table.
- Stable betting controls with an amount slider, pot presets, clear validation, and all-in confirmation.
- Original quiet arcade jazz during play, with separate music/effects toggles and volume controls in **Audio**. Preferences are saved; music pauses in hidden tabs and stops when leaving the table. Browser audio starts after an interaction.
- A responsive lobby and table, room invitations, readiness, configurable pace, chat, reactions, recent hand history, a hand-strength hint, and an in-game poker primer.
- One shared rules engine for multiplayer and practice. Stacks carry between hands; blinds rotate correctly, including heads-up and dead-button progression after eliminations.
- Side pots, short calls, minimum raises, cumulative short all-ins, uncalled-chip refunds, board runouts, ties, and clockwise odd-chip awards.
- Server-authoritative actions and personalized snapshots. Opponent cards, session credentials, and undealt cards are never included in other players’ snapshots. Uncontested winning hands stay hidden.
- Stable per-tab seats, reconnect recovery, timed turns, automatic next hands, host migration, bounded event/message rates, revision checks, and duplicate action protection.
- PostgreSQL recovery for hosted games, with atomic file snapshots for local development. A server restart restores seats, stacks, the deck, and hand history. All-offline rooms pause and expire after 24 hours.
- Finite-stack game nights, a winner screen, and rematches. Eliminated players can watch and chat while the others finish.

## The stakes idea

Each person gets **one stack for the entire game night**. No instant rebuys. That makes all-ins a meaningful choice: busting means watching until the rematch. Blinds can rise to keep a night moving, or remain fixed for a relaxed session.

A good future addition would be a **friends-only season**: award points for placement over several nights, with a rotating pixel trophy or cosmetic title for the leader. Reward results rather than individual aggressive actions. The current version includes the finite-stack foundation; season accounts and cross-night leaderboards are not implemented.

## Commands

| Command                                     | Purpose                                                             |
| ------------------------------------------- | ------------------------------------------------------------------- |
| `npm run dev`                               | Frontend on 3000 + server on 3001, with file watching               |
| `npm run dev:client` / `npm run dev:server` | Start either process separately                                     |
| `npm run check`                             | Lint, rules/socket tests, and production build                      |
| `npm test`                                  | Node tests; optional real PostgreSQL checks via `TEST_DATABASE_URL` |
| `npm run build`                             | Build the client into `dist/`                                       |
| `npm start`                                 | Serve the built client and Socket.IO from one origin on port 3001   |

## Project layout

```text
shared/                 Poker rules, deck, evaluator, settings and bot policy
server/server.js        Socket protocol, room lifecycle, timers and recovery
server/storage.js       PostgreSQL persistence and local file recovery
src/services/           Client connection state, practice adapter and audio
src/components/         Lobby, table, controls, chat, menus and pixel artwork
public/assets/art/      Generated pixel clubhouse illustration
tests/                  Rule edge cases, randomized play and real socket clients
```

The earlier duplicate engines, placeholder audio lookups, account-balance economy, and force-next-hand debug controls have been removed. Original PNG sprites remain under `public/assets/` as reference assets; the new table uses the code-native pixel artwork in `PixelArt.jsx`.

## Hosting and recovery

See [multiplayer setup](MULTIPLAYER_SETUP.md), [deployment](DEPLOYMENT_GUIDE.md), and [art notes](ART_DIRECTION.md).

The recommended setup is **Vercel for the frontend + one Northflank game-server instance + PostgreSQL**. The deployment guide lists the dashboard settings and environment variables. Accepted changes are saved before confirmation; a replacement server recovers the table from the database. Local development uses `.data/rooms.json` automatically. Both storage formats contain private game state and hashed session tokens: keep them private and out of Git.

This is designed for a **single Node process** and small private groups. There are no accounts: keep the same browser tab to retain your seat token. Closing the tab or clearing site storage can lose that seat.

The rules implementation was checked against the [Poker TDA rules and examples](https://www.pokertda.com/view-poker-tda-rules/) for raises, side pots, heads-up action, and odd chips. This friendly online game intentionally allows a disconnected seat to check/fold on a timer instead of enforcing an in-person at-seat rule. Reconnection and acknowledgements follow [Socket.IO’s delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/); a timed-out action triggers state refresh rather than silently replaying a bet.
