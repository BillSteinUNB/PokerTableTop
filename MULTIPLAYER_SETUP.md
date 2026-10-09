# Playing with friends

## On this computer or the same Wi-Fi

1. Install Node 22.12 or newer.
2. Run `npm ci` once from the project root.
3. Run `npm run dev`. Leave the terminal running.
4. Open `http://localhost:3000`, or use the LAN address Vite prints if sharing with other devices.
5. Create a room. Your friends follow the invite link or enter its six-character code. Each player should use their own tab/device and a unique name.
6. Everyone selects **I’m ready**; the host chooses **Start game**.

The development frontend proxies `/socket.io` and `/api` to port 3001. You don’t need to edit a localhost URL in the source. To share on Wi-Fi, allow the frontend’s port 3000 through the host computer’s private-network firewall. The guests do not need Node or this repository.

Opening a fresh tab normally creates an independent player. A browser’s **Duplicate tab** command can copy session storage: the copied tab may reclaim the original seat, which safely disconnects the earlier connection. Use a new tab opened normally to create a second player.

## The host’s controls

The host can configure stacks, blinds, seats (2–8), turn time (15–90 seconds), and blind increases before the game starts. Changing settings resets guests’ readiness. Add or remove bots, or clear a disconnected lobby seat using its × button. A running game locks these settings and seats.

If the host disconnects, another connected human becomes host. A host can advance a completed showdown early; nobody can skip or reset an active hand. After the winner is announced, the host opens a rematch lobby and everyone readies again.

## Reconnects and timeouts

- Refreshing or briefly losing the network keeps the same seat and private cards.
- While at least one human is connected, turns continue. An expired turn checks when free, otherwise folds.
- Leaving a running game parks your seat. **Return to your saved seat** on the home screen rejoins it from the same tab. Starting another room replaces that tab’s saved-seat token.
- If all humans disconnect, game and bot timers pause. Returning resumes with a fresh timer.
- Rooms expire after 24 hours without connected humans. Hosted games recover from PostgreSQL; local games use a recovery file.
- Practice saves its state in the current tab and survives refresh. Leaving practice ends that practice session.

## Over the internet

Host the frontend on Vercel and the game server plus PostgreSQL on Northflank. Friends open the Vercel link; their browsers connect directly to Northflank for multiplayer. See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for the exact settings. A single Node host behind HTTPS is also supported.

## Troubleshooting

**Server unavailable:** confirm both development processes started and ports 3000/3001 are available. Practice still works without the multiplayer server after the app loads.

**Friend’s invite opens nothing:** a `localhost` link points at their computer. Share a LAN address on the same network, or your deployed HTTPS address across networks.

**Room not found after deployment:** confirm the same PostgreSQL database is linked and `/api/ready` reports `storage: postgres`. For file-based hosting, check the persistent volume at `POKER_DATA_FILE`. The server stops if a snapshot is corrupt instead of silently discarding it. Back it up before recovery.

**Cannot start:** everyone must be connected and ready, and the table needs at least two players. Add a bot or clear a disconnected lobby seat.

**No sound:** click the music-note button. Sound defaults off and requires a user interaction because of browser autoplay rules.
