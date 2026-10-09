import { useEffect, useState } from "react";
import { gameClient } from "./services/gameClient.js";
import { audio } from "./services/audio.js";
import { useTable, run } from "./services/ui.js";
import { Suit } from "./components/PixelArt.jsx";
import Home from "./components/Home.jsx";
import Help from "./components/Help.jsx";
import Setup from "./components/Setup.jsx";
import Lobby from "./components/Lobby.jsx";
import Table from "./components/Table.jsx";
import Results from "./components/Results.jsx";
import Modal from "./components/Modal.jsx";
import AudioControls from "./components/AudioControls.jsx";
import "./App.css";

export default function App() {
  const state = useTable();
  const invite = new URLSearchParams(location.search)
    .get("room")
    ?.toUpperCase();
  const [setup, setSetup] = useState(invite ? { mode: "join" } : null);
  const [help, setHelp] = useState(false);
  const [leave, setLeave] = useState(false);
  useEffect(() => {
    gameClient.boot();
  }, []);
  useEffect(() => {
    audio.start();
    return () => audio.stop();
  }, []);
  const atTable = !!state.game && state.game.street !== "finished";
  useEffect(() => {
    audio.setTableActive(atTable);
  }, [atTable]);
  const connected =
    state.connection === "connected" || state.connection === "local";
  const openSetup = (mode, avatar) => {
    gameClient.clearError();
    setSetup({ mode, avatar });
  };
  return (
    <div className={`app ${state.room ? "in-room" : ""}`}>
      <header className="app-header">
        <button
          className="brand"
          aria-label="Pixel Poker home"
          onClick={() => (state.room ? setLeave(true) : setSetup(null))}
        >
          <span className="brand-icon">
            <Suit />
          </span>
          <span>
            PIXEL
            <span className="brand-second">
              POKER<span className="brand-dot">.</span>
            </span>
          </span>
        </button>
        <nav aria-label="Main navigation">
          {state.room && (
            <span className={`connection-badge ${connected ? "online" : ""}`}>
              <i className="status-dot" />
              {state.mode === "practice"
                ? "LOCAL PLAY"
                : connected
                  ? "CONNECTED"
                  : "RECONNECTING"}
            </span>
          )}
          <button className="nav-button" onClick={() => setHelp(true)}>
            HOW TO PLAY <span>?</span>
          </button>
          <AudioControls atTable={atTable} />
          {state.room && (
            <button
              className="nav-button leave-button"
              onClick={() => setLeave(true)}
            >
              LEAVE <span>↗</span>
            </button>
          )}
        </nav>
      </header>
      {state.room && !connected && (
        <div className="connection-banner" role="status">
          <span className="waiting-pixels">
            <i />
            <i />
            <i />
          </span>{" "}
          Reconnecting… your seat and chips are saved. Betting is paused on this
          device.
        </div>
      )}
      {state.error && !setup && (
        <div className="error-toast" role="alert">
          <span>{state.error}</span>
          <button onClick={gameClient.clearError} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}
      {state.game ? (
        state.game.street === "finished" ? (
          <Results />
        ) : (
          <Table />
        )
      ) : state.room ? (
        <Lobby />
      ) : (
        <Home openSetup={openSetup} />
      )}
      {setup && !state.room && (
        <Setup
          mode={setup.mode}
          initialAvatar={setup.avatar}
          invite={invite}
          onClose={() => {
            setSetup(null);
            gameClient.clearError();
          }}
        />
      )}
      {help && <Help onClose={() => setHelp(false)} />}
      {leave && (
        <Modal title="Leave the table?" onClose={() => setLeave(false)}>
          <p>
            {state.mode === "practice"
              ? "Leaving ends this practice game. You can start a fresh one anytime."
              : state.game
                ? "Your seat stays reserved in this tab. While you’re away, your turns check when free or fold to a bet. Come back with “Return to your saved seat.”"
                : "You’ll leave this room. Use the code to join again."}
          </p>
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => setLeave(false)}
            >
              CANCEL
            </button>
            <button
              className="button pink"
              disabled={state.busy}
              onClick={async () => {
                if (await run(gameClient.leave)) {
                  setLeave(false);
                  setSetup(null);
                }
              }}
            >
              LEAVE TABLE →
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
