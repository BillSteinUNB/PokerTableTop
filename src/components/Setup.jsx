import { useState } from "react";
import { DEFAULT_SETTINGS } from "../../shared/settings.js";
import { gameClient } from "../services/gameClient.js";
import { useTable, readLocal, saveLocal, run, number } from "../services/ui.js";
import {
  readTablePreferences,
  saveTablePreferences,
} from "../services/tablePreferences.js";
import Modal from "./Modal.jsx";
import ProfilePicker from "./ProfilePicker.jsx";
import "./Setup.css";

const PRESETS = {
  classic: DEFAULT_SETTINGS,
  quick: {
    ...DEFAULT_SETTINGS,
    startingChips: 1000,
    blindIncreaseEvery: 5,
    turnSeconds: 20,
  },
  chill: { ...DEFAULT_SETTINGS, blindIncreaseEvery: 0, turnSeconds: 60 },
};

export default function Setup({ mode, onClose, initialAvatar, invite }) {
  const { busy, error } = useTable();
  const [profile, setProfile] = useState(() => ({
    ...readLocal("poker-profile", { name: "", avatar: "fox" }),
    ...(initialAvatar ? { avatar: initialAvatar } : {}),
  }));
  const [code, setCode] = useState(invite || "");
  const [previousSettings] = useState(readTablePreferences);
  const [preset, setPreset] = useState(
    previousSettings ? "previous" : "classic",
  );
  const selectedSettings =
    preset === "previous" ? previousSettings : PRESETS[preset];
  async function submit(event) {
    event.preventDefault();
    saveLocal("poker-profile", profile);
    const ok = await run(() =>
      mode === "practice"
        ? gameClient.practice(profile)
        : mode === "join"
          ? gameClient.join(code, profile)
          : gameClient.create(profile, selectedSettings),
    );
    if (ok) {
      if (mode === "create") saveTablePreferences(selectedSettings);
      history.replaceState(null, "", location.pathname);
      onClose();
    }
  }
  return (
    <Modal
      className="setup-modal"
      title={
        mode === "join"
          ? "Join a room"
          : mode === "practice"
            ? "Practice"
            : "Create a room"
      }
      onClose={onClose}
    >
      <p className="muted">
        {mode === "practice"
          ? "Play against three bots with no turn timer."
          : mode === "join"
            ? "Enter the room code. If a hand is running, you’ll play the next one."
            : "Choose your name, avatar, and game settings."}
      </p>
      <form onSubmit={submit}>
        <div className="setup-form-fields">
          {mode === "join" && (
            <>
              <label className="field-label" htmlFor="room-code">
                ROOM CODE
              </label>
              <input
                className="code-input"
                id="room-code"
                value={code}
                maxLength={6}
                minLength={6}
                required
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="ABC234"
                onChange={(e) =>
                  setCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                  )
                }
              />
            </>
          )}
          <ProfilePicker profile={profile} setProfile={setProfile} />
          {mode === "create" && (
            <>
              <span className="field-label" id="game-preset-label">
                GAME PRESET
              </span>
              <div
                className="preset-picker"
                role="group"
                aria-labelledby="game-preset-label"
              >
                {previousSettings && (
                  <button
                    type="button"
                    aria-pressed={preset === "previous"}
                    className={`preset-previous${preset === "previous" ? " selected" : ""}`}
                    onClick={() => setPreset("previous")}
                  >
                    <b>Last used</b>
                    <small>
                      {number(previousSettings.startingChips)} chips ·{" "}
                      {previousSettings.turnSeconds}s turns ·{" "}
                      {previousSettings.maxPlayers} seats
                    </small>
                  </button>
                )}
                {[
                  ["classic", "Standard", "2,000 chips · 30s turns"],
                  ["quick", "Fast", "1,000 chips · 20s turns"],
                  ["chill", "Relaxed", "Fixed blinds · 60s turns"],
                ].map(([id, title, text]) => (
                  <button
                    type="button"
                    key={id}
                    aria-pressed={preset === id}
                    className={preset === id ? "selected" : ""}
                    onClick={() => setPreset(id)}
                  >
                    <b>{title}</b>
                    <small>{text}</small>
                  </button>
                ))}
              </div>
              <p className="tiny muted">
                {selectedSettings.blindIncreaseEvery === 0
                  ? `Blinds stay at ${number(selectedSettings.smallBlind)} / ${number(selectedSettings.bigBlind)}.`
                  : `Blinds start at ${number(selectedSettings.smallBlind)} / ${number(selectedSettings.bigBlind)} and double every ${selectedSettings.blindIncreaseEvery} ${selectedSettings.blindIncreaseEvery === 1 ? "hand" : "hands"}.`}{" "}
                Customize more in the lobby.
              </p>
            </>
          )}
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="setup-actions">
          <button
            className="button mint full"
            disabled={
              busy ||
              profile.name.trim().length < 2 ||
              (mode === "join" && code.length !== 6)
            }
          >
            {busy
              ? "Loading…"
              : mode === "practice"
                ? "START PRACTICE →"
                : mode === "join"
                  ? "JOIN ROOM →"
                  : "CREATE ROOM →"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
