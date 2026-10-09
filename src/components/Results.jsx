import { useTable, number, run } from "../services/ui.js";
import { gameClient } from "../services/gameClient.js";
import { Avatar } from "./PixelArt.jsx";

export default function Results() {
  const { game, room, playerId, busy, mode } = useTable();
  const champion = game.players.find((p) => p.id === game.champion);
  const ranking = [...game.players].sort(
    (a, b) =>
      b.chips - a.chips || (b.eliminatedAt || 0) - (a.eliminatedAt || 0),
  );
  return (
    <main className="results-page">
      <div className="result-sparkles">✦ · ✧ · ✦</div>
      <span className="eyebrow">GAME OVER</span>
      <h1>{champion ? `${champion.name} wins` : "Game complete"}</h1>
      <div className="champion-avatar">
        <span>♛</span>
        <Avatar kind={champion?.avatar} />
      </div>
      <p>{game.handNumber} hands played</p>
      <div className="standings">
        {ranking.map((p, i) => (
          <div key={p.id}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <Avatar kind={p.avatar} />
            <b>
              {p.name}
              {p.id === playerId ? " (you)" : ""}
            </b>
            <small>{p.handsWon} hands won</small>
            <strong>{number(p.chips)}</strong>
          </div>
        ))}
      </div>
      {room.hostId === playerId ? (
        <button
          className="button mint"
          disabled={busy}
          onClick={() => run(gameClient.rematch)}
        >
          {mode === "practice" ? "PLAY AGAIN →" : "BACK TO LOBBY · REMATCH →"}
        </button>
      ) : (
        <p className="muted">Waiting for the host to open the rematch.</p>
      )}
    </main>
  );
}
