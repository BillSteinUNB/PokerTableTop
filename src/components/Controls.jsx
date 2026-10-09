import { useId, useState } from "react";
import { useTable, number, run } from "../services/ui.js";
import { gameClient } from "../services/gameClient.js";
import { audio } from "../services/audio.js";
import { evaluateHand } from "../../shared/handEvaluator.js";
import {
  betLimits,
  parseBetAmount,
  potSizedTotal,
} from "../services/betSizing.js";
import Modal from "./Modal.jsx";
import "./Controls.css";

export default function Controls() {
  const { game, playerId, busy, connection, mode } = useTable();
  const me = game.players.find((player) => player.id === playerId);
  const legal = game.legal;
  const disabled = busy || (mode === "online" && connection !== "connected");
  const handName =
    me.hand.length === 2 && me.hand.every(Boolean) && game.board.length >= 3
      ? evaluateHand([...me.hand, ...game.board]).name
      : null;

  return (
    <section
      className={`bet-panel ${legal ? "is-active" : "is-waiting"}`}
      aria-label="Betting controls"
      aria-busy={busy}
    >
      <div className="bet-panel-heading">
        <span className="bet-turn-label">
          <i aria-hidden="true" />
          {legal
            ? "YOUR TURN"
            : me.eliminatedAt
              ? "ELIMINATED"
              : game.street === "showdown"
                ? "HAND COMPLETE"
                : "WAITING"}
        </span>
        {handName && <span className="bet-hand-name">{handName}</span>}
      </div>
      {legal ? (
        <ActiveControls
          key={`${game.handNumber}:${game.street}:${game.actor}:${game.currentBet}:${legal.minRaise}:${legal.maxRaise}:${legal.canRaise}`}
          game={game}
          legal={legal}
          me={me}
          disabled={disabled}
        />
      ) : (
        <div className="bet-waiting">
          <span className="bet-waiting-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <b>
            {game.street === "showdown"
              ? "The next hand is up soon."
              : me.eliminatedAt
                ? "You’re out of chips. You can keep watching."
                : me.folded
                  ? "You folded this hand."
                  : me.allIn
                    ? "You’re all in."
                    : `${game.players[game.actor]?.name || "The table"} to act.`}
          </b>
          <span>
            {game.street === "showdown"
              ? "Your cards will be dealt automatically."
              : me.folded || me.allIn || me.eliminatedAt
                ? "Waiting for the hand to finish."
                : "Your controls will appear when it’s your turn."}
          </span>
        </div>
      )}
    </section>
  );
}

function ActiveControls({ game, legal, me, disabled }) {
  const { minimum, maximum } = betLimits(legal);
  const [amount, setAmount] = useState(String(minimum));
  const [confirmAllIn, setConfirmAllIn] = useState(false);
  const amountId = useId();
  const hintId = useId();
  const parsed = parseBetAmount(amount, minimum, maximum);
  const value = parsed.value;
  const hasBet = game.currentBet > 0;
  const sliderValue = Number.isFinite(value)
    ? Math.max(minimum, Math.min(maximum, value))
    : minimum;
  const progress =
    maximum > minimum
      ? ((sliderValue - minimum) / (maximum - minimum)) * 100
      : 100;
  const error = legal.canRaise ? parsed.error : null;
  const errors = {
    empty: "Enter an amount.",
    integer: "Use a whole number of chips.",
    low: `Minimum ${hasBet ? "raise" : "bet"} is ${number(minimum)}.`,
    high: `You can ${hasBet ? "raise to" : "bet"} up to ${number(maximum)}.`,
  };
  const submit = async (action, total) => {
    const accepted = await run(() => gameClient.act(action, total));
    if (accepted) {
      audio.play(
        action === "fold" ? "fold" : action === "check" ? "check" : "bet",
      );
      setConfirmAllIn(false);
    }
  };

  return (
    <>
      <div className="bet-sizing">
        <div className="bet-amount-field">
          <label htmlFor={amountId}>{hasBet ? "RAISE TO" : "BET"}</label>
          <input
            id={amountId}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            aria-label={hasBet ? "Raise total" : "Bet amount"}
            aria-describedby={hintId}
            aria-invalid={Boolean(error)}
            value={amount}
            disabled={!legal.canRaise || disabled}
            onChange={(event) => setAmount(event.target.value)}
            onFocus={(event) => event.target.select()}
          />
        </div>
        <div className="bet-slider-group">
          <input
            className="bet-slider"
            type="range"
            aria-label={hasBet ? "Adjust raise total" : "Adjust bet amount"}
            aria-valuetext={`${number(sliderValue)} chips${hasBet ? " total" : ""}`}
            min={minimum}
            max={maximum}
            step="1"
            value={sliderValue}
            disabled={!legal.canRaise || disabled || minimum === maximum}
            style={{ "--bet-progress": `${progress}%` }}
            onChange={(event) => setAmount(event.target.value)}
          />
          <div className="bet-presets-row">
            {[
              [minimum, "Min"],
              [potSizedTotal(game, legal, 0.5), "½ pot"],
              [potSizedTotal(game, legal, 1), "Pot"],
            ].map(([total, label]) => (
              <button
                type="button"
                key={label}
                disabled={!legal.canRaise || disabled}
                title={`${hasBet ? "Raise to" : "Bet"} ${number(total)}`}
                onClick={() => setAmount(String(total))}
              >
                {label}
              </button>
            ))}
            <button
              className="bet-all-in"
              type="button"
              disabled={!legal.canAllIn || disabled}
              onClick={() => setConfirmAllIn(true)}
            >
              All in
            </button>
          </div>
        </div>
      </div>
      <div className={`bet-detail ${error ? "has-error" : ""}`} id={hintId}>
        {error
          ? errors[error]
          : !legal.canRaise
            ? "Raising isn’t available this turn."
            : value === maximum
              ? `All in · your remaining ${number(me.chips)} chips`
              : `${number(value - me.bet)} chips to add · ${number(minimum)}–${number(maximum)} total`}
      </div>
      <div className="bet-action-row">
        <button
          className="button bet-fold"
          disabled={disabled}
          onClick={() => submit("fold")}
        >
          FOLD
        </button>
        <button
          className="button mint"
          disabled={disabled}
          onClick={() =>
            !legal.canCheck && legal.call === me.chips
              ? setConfirmAllIn(true)
              : submit(legal.canCheck ? "check" : "call")
          }
        >
          {legal.canCheck ? (
            "CHECK"
          ) : (
            <>
              <span>CALL</span>
              <b>{number(legal.call)}</b>
            </>
          )}
        </button>
        <button
          className="button lilac"
          disabled={!legal.canRaise || disabled || Boolean(error)}
          onClick={() =>
            value === maximum ? setConfirmAllIn(true) : submit("raise", value)
          }
        >
          <span>{hasBet ? "RAISE TO" : "BET"}</span>
          <b>{!error && legal.canRaise ? number(value) : "—"}</b>
        </button>
      </div>
      {confirmAllIn && (
        <Modal title="Go all in?" onClose={() => setConfirmAllIn(false)}>
          <p>
            Commit your remaining <b>{number(me.chips)} chips</b> to this hand?
            There are no rebuys.
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
              onClick={() => submit("all-in")}
            >
              ALL IN · {number(me.chips)}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
