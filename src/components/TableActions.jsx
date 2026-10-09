import { useState } from "react";
import { useTable, number, run } from "../services/ui.js";
import { gameClient } from "../services/gameClient.js";
import Modal from "./Modal.jsx";
import ShareRoom from "./ShareRoom.jsx";
import "./TableActions.css";

export default function TableActions() {
  const { room, game, playerId, mode, busy, connection } = useTable();
  const [inviteOpen, setInviteOpen] = useState(false);
  if (mode !== "online") return null;

  const isHost = room.hostId === playerId;
  const openSeats = Math.max(0, room.settings.maxPlayers - room.players.length);
  const ending =
    game.street === "showdown" &&
    game.players.filter((p) => p.chips > 0).length < 2;
  const breakRequested = !ending && (room.pauseAfterHand || room.paused);
  const disabled = busy || connection !== "connected";

  return (
    <>
      <div className="table-actions" aria-label="Table actions">
        <div className="table-invite-action">
          <button
            type="button"
            className="button secondary compact"
            onClick={() => setInviteOpen(true)}
          >
            INVITE +
          </button>
          <span>
            {openSeats
              ? `${openSeats} open ${openSeats === 1 ? "seat" : "seats"}`
              : "Table full"}
          </span>
        </div>
        {isHost && !ending && (
          <button
            type="button"
            className={`button compact ${room.paused ? "mint" : "secondary"}`}
            disabled={disabled}
            onClick={() => run(() => gameClient.pause(!breakRequested))}
          >
            {room.paused
              ? "RESUME TABLE →"
              : room.pauseAfterHand
                ? "CANCEL BREAK"
                : game.street === "showdown"
                  ? "PAUSE TABLE"
                  : "PAUSE AFTER HAND"}
          </button>
        )}
      </div>
      {breakRequested && (
        <div
          className={`table-break ${room.paused ? "is-paused" : ""}`}
          role="status"
        >
          <span className="table-break-icon" aria-hidden="true" />
          <div>
            <b>{room.paused ? "Table paused" : "Break after this hand"}</b>
            <span>
              {room.paused
                ? isHost
                  ? "Resume the table when everyone is ready."
                  : "Waiting for the host to resume."
                : "Finish this hand. The next deal will wait."}
            </span>
          </div>
        </div>
      )}
      {inviteOpen && (
        <Modal title="Invite players" onClose={() => setInviteOpen(false)}>
          <p className="muted">
            {openSeats
              ? `New players join on the next deal with ${number(room.settings.startingChips)} chips.`
              : "All seats are taken, including reserved seats."}
          </p>
          <div className="table-invite-share">
            <ShareRoom />
          </div>
          <p className="tiny muted">
            {room.players.length} / {room.settings.maxPlayers} seats taken
          </p>
        </Modal>
      )}
    </>
  );
}
