import { useState } from "react";
import { DEFAULT_SETTINGS } from "../../shared/settings.js";
import { gameClient } from "../services/gameClient.js";
import { useTable, readLocal, saveLocal, run } from "../services/ui.js";
import Modal from "./Modal.jsx";
import ProfilePicker from "./ProfilePicker.jsx";

export default function Setup({ mode, onClose, initialAvatar, invite }) {
  const { busy, error } = useTable();
  const [profile, setProfile] = useState(() => ({
    ...readLocal("poker-profile", { name: "", avatar: "fox" }),
    ...(initialAvatar ? { avatar: initialAvatar } : {}),
  }));
  const [code, setCode] = useState(invite || "");
  const [preset, setPreset] = useState("classic");
  const presets = {
    classic: DEFAULT_SETTINGS,
    quick: {
      ...DEFAULT_SETTINGS,
      startingChips: 1000,
      blindIncreaseEvery: 5,
      turnSeconds: 20,
    },
    chill: { ...DEFAULT_SETTINGS, blindIncreaseEvery: 0, turnSeconds: 60 },
  };
  async function submit(event) {
    event.preventDefault();
    saveLocal("poker-profile", profile);
    const ok = await run(() =>
      mode === "practice"
        ? gameClient.practice(profile)
        : mode === "join"
          ? gameClient.join(code, profile)
          : gameClient.create(profile, presets[preset]),
    );
    if (ok) {
      history.replaceState(null, "", location.pathname);
      onClose();
    }
  }
  return (
    <Modal
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
            ? "Enter the room code."
            : "Choose your name, avatar, and game settings."}
      </p>
      <form onSubmit={submit}>
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
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
            />
          </>
        )}
        <ProfilePicker profile={profile} setProfile={setProfile} />
        {mode === "create" && (
          <>
            <span className="field-label">GAME PRESET</span>
            <div className="preset-picker">
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
              {preset === "chill"
                ? "Blinds stay at 10 / 20."
                : `Blinds start at 10 / 20 and double every ${presets[preset].blindIncreaseEvery} hands.`}{" "}
              Customize more in the lobby.
            </p>
          </>
        )}
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
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
      </form>
    </Modal>
  );
}
