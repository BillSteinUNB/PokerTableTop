import { useState } from "react";
import { useTable, number, run } from "../services/ui.js";
import { gameClient } from "../services/gameClient.js";
import { Avatar } from "./PixelArt.jsx";
import ShareRoom from "./ShareRoom.jsx";
import Settings from "./Settings.jsx";
import ChatPanel from "./ChatPanel.jsx";

export default function Lobby() {
  const { room, playerId, busy, connection } = useTable();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isHost = room.hostId === playerId;
  const me = room.players.find((p) => p.id === playerId);
  const ready =
    room.players.length > 1 &&
    room.players.every((p) => p.ready && p.connected);
  return (
    <main className="lobby-page">
      <div className="page-intro">
        <div>
          <h1>Lobby</h1>
          <p className="muted">Waiting for players to ready up.</p>
        </div>
        <ShareRoom />
      </div>
      <div className="lobby-layout">
        <section className="lobby-main">
          <div className="section-heading">
            <h2>
              PLAYERS{" "}
              <span>
                {room.players.length}/{room.settings.maxPlayers}
              </span>
            </h2>
            {isHost && (
              <button
                className="text-button"
                onClick={() => setSettingsOpen(true)}
              >
                TABLE SETTINGS ↗
              </button>
            )}
          </div>
          <div
            className="lobby-seats"
            style={{
              "--lobby-columns":
                room.settings.maxPlayers > 6
                  ? 4
                  : Math.min(room.settings.maxPlayers, 3),
            }}
          >
            {Array.from({ length: room.settings.maxPlayers }, (_, i) => {
              const p = room.players[i];
              return p ? (
                <div className="lobby-seat" key={p.id}>
                  <span className="seat-number">
                    SEAT {String(i + 1).padStart(2, "0")}
                  </span>
                  <Avatar kind={p.avatar} />
                  <h3>
                    {p.name} {p.id === playerId && <small>YOU</small>}
                  </h3>
                  <span className="player-tag">
                    {p.isBot ? "BOT" : room.hostId === p.id ? "HOST" : "PLAYER"}
                  </span>
                  <span
                    className={`ready-tag ${p.connected && p.ready ? "is-ready" : ""}`}
                  >
                    {!p.connected
                      ? "○ RECONNECTING"
                      : p.ready
                        ? "● READY"
                        : "○ NOT READY"}
                  </span>
                  {isHost && p.isBot && (
                    <button
                      className="remove-bot"
                      aria-label={`Remove ${p.name}`}
                      onClick={() => run(() => gameClient.removeBot(p.id))}
                    >
                      ×
                    </button>
                  )}
                  {isHost && !p.connected && !p.isBot && (
                    <button
                      className="remove-bot"
                      aria-label={`Clear disconnected seat for ${p.name}`}
                      title="Clear disconnected seat"
                      disabled={busy}
                      onClick={() => run(() => gameClient.removeAway(p.id))}
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <div className="lobby-seat empty" key={i}>
                  <span className="seat-number">
                    SEAT {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="empty-avatar">+</div>
                  <h3>Empty seat</h3>
                  {isHost ? (
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() => run(gameClient.addBot)}
                    >
                      ADD BOT +
                    </button>
                  ) : (
                    <span className="muted tiny">WAITING FOR A PLAYER</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="table-rules">
            <div>
              <span>STARTING STACK</span>
              <b>{number(room.settings.startingChips)}</b>
            </div>
            <div>
              <span>BLINDS</span>
              <b>
                {room.settings.smallBlind} / {room.settings.bigBlind}
              </b>
            </div>
            <div>
              <span>TURN TIMER</span>
              <b>{room.settings.turnSeconds}s</b>
            </div>
            <div>
              <span>BLINDS DOUBLE</span>
              <b>
                {room.settings.blindIncreaseEvery
                  ? `Every ${room.settings.blindIncreaseEvery} hands`
                  : "Never"}
              </b>
            </div>
          </div>
          <div className="lobby-start">
            <p>
              {isHost
                ? ready
                  ? "Everyone is ready."
                  : "Invite a friend or add a bot. Everyone must be ready."
                : me?.ready
                  ? "Waiting for the host to start."
                  : "Ready up to start."}
            </p>
            {isHost ? (
              <button
                className="button mint"
                disabled={!ready || busy || connection !== "connected"}
                onClick={() => run(gameClient.start)}
              >
                START GAME →
              </button>
            ) : (
              <button
                className={`button ${me?.ready ? "secondary" : "mint"}`}
                disabled={busy || connection !== "connected"}
                onClick={() => run(() => gameClient.ready(!me?.ready))}
              >
                {me?.ready ? "NOT READY YET" : "I’M READY →"}
              </button>
            )}
          </div>
        </section>
        <ChatPanel />
      </div>
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </main>
  );
}
