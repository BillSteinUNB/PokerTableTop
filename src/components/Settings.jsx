import { useState } from "react";
import { useTable, run } from "../services/ui.js";
import { gameClient } from "../services/gameClient.js";
import Modal from "./Modal.jsx";

export default function Settings({ onClose }) {
  const { room, busy } = useTable();
  const [settings, setSettings] = useState(room.settings);
  const [error, setError] = useState("");
  const fields = [
    ["startingChips", "Starting chips", 200, 100000],
    ["smallBlind", "Small blind", 1, 5000],
    ["bigBlind", "Big blind", 2, 10000],
    ["maxPlayers", "Seats", 2, 8],
    ["turnSeconds", "Seconds per turn", 15, 90],
    ["blindIncreaseEvery", "Double blinds every N hands (0 = never)", 0, 50],
  ];
  return (
    <Modal title="Table settings" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const ok = await run(() => gameClient.configure(settings));
          if (ok) onClose();
          else setError(gameClient.getSnapshot().error);
        }}
      >
        <div className="settings-grid">
          {fields.map(([key, label, min, max]) => (
            <label key={key}>
              {label}
              <input
                type="number"
                value={settings[key]}
                min={min}
                max={max}
                step="1"
                required
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    [key]: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
              />
            </label>
          ))}
        </div>
        <p className="muted tiny">
          Everyone starts with the same stack. Changing settings asks your
          friends to ready up again.
        </p>
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        <button className="button mint full" disabled={busy}>
          SAVE TABLE SETTINGS
        </button>
      </form>
    </Modal>
  );
}
