import { useTable, run } from "../services/ui.js";
import { gameClient } from "../services/gameClient.js";

export default function Home({ openSetup }) {
  const { parked, busy } = useTable();
  return (
    <main className="home">
      <section className="hero">
        <div className="hero-copy">
          <h1>
            PIXEL
            <br />
            <span>POKER</span>
          </h1>
          <p>Texas Hold’em · 2–8 players</p>
          <div className="hero-actions">
            <button className="button mint" onClick={() => openSetup("create")}>
              CREATE A ROOM <span>↗</span>
            </button>
            <button
              className="button secondary"
              onClick={() => openSetup("join")}
            >
              JOIN A ROOM <span>→</span>
            </button>
          </div>
          <button
            className="practice-link"
            onClick={() => openSetup("practice")}
          >
            <span className="play-triangle">▶</span> Practice with bots{" "}
            <span>→</span>
          </button>
          {parked && (
            <button
              className="resume-link"
              disabled={busy}
              onClick={() => run(gameClient.resume)}
            >
              ↳ Return to your saved seat
            </button>
          )}
        </div>
        <div className="hero-scene">
          <img
            src="/assets/art/pixel-clubhouse.png"
            alt="A cozy pixel-art poker clubhouse with neon city lights, an arcade cabinet, and a green card table"
          />
        </div>
      </section>
    </main>
  );
}
