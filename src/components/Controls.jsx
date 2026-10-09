import { useState } from "react";
import { useTable, number, run } from "../services/ui.js";
import { gameClient } from "../services/gameClient.js";
import { evaluateHand } from "../../shared/handEvaluator.js";
import Modal from "./Modal.jsx";

export default function Controls() {
  const { game, playerId, busy, connection, mode } = useTable();
  const legal = game.legal;
  const [raise, setRaise] = useState(() =>
    legal ? String(Math.min(legal.minRaise, legal.maxRaise)) : "",
  );
  const [confirmAllIn, setConfirmAllIn] = useState(false);
  const minimum = legal ? Math.min(legal.minRaise, legal.maxRaise) : 0;
  const value = Number(raise);
  const validRaise =
    legal &&
    raise !== "" &&
    Number.isSafeInteger(value) &&
    value >= minimum &&
    value <= legal.maxRaise;
  const me = game.players.find((p) => p.id === playerId);
  const disabled = busy || (mode === "online" && connection !== "connected");
  const handName =
    me.hand.every(Boolean) && me.hand.length === 2 && game.board.length >= 3
      ? evaluateHand([...me.hand, ...game.board]).name
      : null;
  if (!legal)
    return (
      <div className="controls waiting-controls">
        <div>
          <span className="eyebrow">
            {me.chips === 0 && me.eliminatedAt
              ? "ELIMINATED"
              : game.street === "showdown"
                ? "HAND COMPLETE"
                : "WAITING"}
          </span>
          <b>
            {game.street === "showdown"
              ? "Next hand is on its way…"
              : me.folded
                ? "You folded. Waiting for the next hand."
                : `${game.players[game.actor]?.name || "The table"} is thinking…`}
          </b>
        </div>
        {handName && <span className="hand-hint">{handName}</span>}
        <span className="waiting-pixels">
          <i />
          <i />
          <i />
        </span>
      </div>
    );
  return (
    <div className="controls">
      <div className="controls-heading">
        <span>
          <i className="status-dot" /> YOUR MOVE{" "}
          <small>
            {legal.toCall
              ? `${number(legal.call)} to call`
              : "You can check for free"}
          </small>
        </span>
        {handName && <span className="hand-hint">{handName}</span>}
      </div>
      <div className="action-row">
        <button
          className="button fold"
          disabled={disabled}
          onClick={() => run(() => gameClient.act("fold"))}
        >
          FOLD
        </button>
        <button
          className="button mint"
          disabled={disabled}
          onClick={() =>
            run(() => gameClient.act(legal.canCheck ? "check" : "call"))
          }
        >
          {legal.canCheck ? "CHECK" : `CALL ${number(legal.call)}`}
        </button>
        <div className="raise-control">
          <label htmlFor="raise-amount">
            {game.currentBet ? "RAISE TO" : "BET"}
          </label>
          <input
            id="raise-amount"
            aria-label="Raise total"
            type="number"
            min={minimum}
            max={legal.maxRaise}
            step="1"
            value={raise}
            disabled={!legal.canRaise || disabled}
            onChange={(e) => setRaise(e.target.value)}
          />
          <button
            className="button lilac"
            disabled={!legal.canRaise || disabled || !validRaise}
            onClick={() =>
              value === legal.maxRaise
                ? setConfirmAllIn(true)
                : run(() => gameClient.act("raise", value))
            }
          >
            RAISE ↑
          </button>
        </div>
        <button
          className="button all-in"
          disabled={!legal.canAllIn || disabled}
          onClick={() => setConfirmAllIn(true)}
        >
          ALL IN
        </button>
      </div>
      <div className="bet-presets">
        <span>QUICK BET</span>
        {[
          [0.5, "½ POT"],
          [1, "POT"],
          [2, "2× POT"],
        ].map(([factor, label]) => (
          <button
            key={label}
            disabled={!legal.canRaise || disabled}
            onClick={() =>
              setRaise(
                Math.min(
                  legal.maxRaise,
                  Math.max(
                    minimum,
                    game.currentBet +
                      Math.ceil((game.pot + legal.call) * factor),
                  ),
                ),
              )
            }
          >
            {label}
          </button>
        ))}
        <span className="raise-hint">
          {legal.canRaise
            ? `Min ${number(minimum)} · Max ${number(legal.maxRaise)}`
            : "Check, call, or fold this turn"}
        </span>
      </div>
      {confirmAllIn && (
        <Modal title="Go all in?" onClose={() => setConfirmAllIn(false)}>
          <p>
            You’re committing your remaining <b>{number(me.chips)} chips</b> to
            this hand. There are no rebuys.
          </p>
          <div className="dialog-actions">
            <button
              className="button secondary"
              onClick={() => setConfirmAllIn(false)}
            >
              CANCEL
            </button>
            <button
              className="button pink"
              disabled={disabled}
              onClick={async () => {
                await run(() => gameClient.act("all-in"));
                setConfirmAllIn(false);
              }}
            >
              CONFIRM ALL IN →
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
