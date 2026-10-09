import { useRef, useEffect, useState } from "react";
import {
  useTable,
  useNow,
  number,
  reactionLabels,
  run,
} from "../services/ui.js";
import { gameClient } from "../services/gameClient.js";
import { audio } from "../services/audio.js";
import { isWinningCard } from "../services/winningCards.js";
import { Avatar, Card, ChipStack, Suit } from "./PixelArt.jsx";
import Controls from "./Controls.jsx";
import ChatPanel from "./ChatPanel.jsx";

// Phones reserve the middle for a single, readable row of community cards.
const phoneSeats = {
  2: [[50, 13]],
  3: [
    [22, 15],
    [78, 15],
  ],
  4: [
    [15, 24],
    [50, 12],
    [85, 24],
  ],
  5: [
    [15, 28],
    [31, 12],
    [69, 12],
    [85, 28],
  ],
  6: [
    [15, 67],
    [15, 25],
    [50, 12],
    [85, 25],
    [85, 67],
  ],
  7: [
    [15, 67],
    [15, 27],
    [32, 11],
    [68, 11],
    [85, 27],
    [85, 67],
  ],
  8: [
    [15, 68],
    [15, 28],
    [25, 10],
    [50, 10],
    [75, 10],
    [85, 28],
    [85, 68],
  ],
};

export default function Table() {
  const state = useTable();
  const { game, room, playerId, reactions, clockOffset } = state;
  const now = useNow() + clockOffset;
  const myIndex = game.players.findIndex((p) => p.id === playerId);
  const players = [
    ...game.players.slice(myIndex),
    ...game.players.slice(0, myIndex),
  ];
  const [flights, setFlights] = useState([]);
  useEffect(() => {
    audio.play("deal");
  }, []);
  useEffect(() => {
    if (!flights.length) return;
    const cleanup = setTimeout(() => setFlights([]), 650);
    return () => clearTimeout(cleanup);
  }, [flights]);
  const seconds = game.deadline
    ? Math.max(0, Math.ceil((game.deadline - now) / 1000))
    : null;
  const nextSeconds = game.nextHandAt
    ? Math.max(0, Math.ceil((game.nextHandAt - now) / 1000))
    : null;
  const prev = useRef({
    hand: game.handNumber,
    street: game.street,
    actor: game.actor,
    bets: game.players.filter((p) => p.bet > 0).map((p) => p.id),
  });
  useEffect(() => {
    if (
      prev.current.hand === game.handNumber &&
      prev.current.street !== game.street
    ) {
      setFlights(prev.current.bets);
    }
    if (prev.current.street !== game.street && game.street === "showdown")
      audio.play("win");
    else if (
      prev.current.hand !== game.handNumber ||
      prev.current.street !== game.street
    )
      audio.play("deal");
    else if (
      prev.current.actor !== game.actor &&
      game.players[game.actor]?.id === playerId
    )
      audio.play("turn");
    prev.current = {
      hand: game.handNumber,
      street: game.street,
      actor: game.actor,
      bets: game.players.filter((p) => p.bet > 0).map((p) => p.id),
    };
  }, [game.handNumber, game.street, game.actor, game.players, playerId]);
  const result = game.result;
  return (
    <main className="table-page">
      <div className="table-toolbar">
        <div>
          <span className="live-tag">
            <i className="status-dot" />
            {state.mode === "practice" ? "PRACTICE TABLE" : `ROOM ${room.code}`}
          </span>
          <span className="toolbar-divider" />
          <span>NO-LIMIT HOLD’EM</span>
        </div>
        <div>
          <span>
            HAND <b>{String(game.handNumber).padStart(2, "0")}</b>
          </span>
          <span>
            BLINDS{" "}
            <b>
              {game.smallBlind} / {game.bigBlind}
            </b>
          </span>
          <span className="level-label">
            LEVEL <b>{game.level + 1}</b>
          </span>
        </div>
      </div>
      <div className="table-layout">
        <section className="play-area" aria-label="Poker table">
          <div className={`table-stage seats-${players.length}`}>
            <div className="table-floor" />
            {flights.map((id) => {
              const index = players.findIndex((p) => p.id === id);
              const angle =
                Math.PI / 2 + (index * Math.PI * 2) / players.length;
              return (
                <span
                  key={id}
                  className="flying-chips"
                  style={{
                    "--from-x": `${50 + 38 * Math.cos(angle)}%`,
                    "--from-y": `${50 + 32 * Math.sin(angle)}%`,
                  }}
                >
                  <ChipStack />
                </span>
              );
            })}
            <div className="poker-table">
              <div className="felt-inner">
                <span className="felt-wordmark">PIXEL POKER</span>
                <div className="felt-suits">
                  <Suit />
                  <Suit suit="hearts" />
                  <Suit suit="clubs" />
                  <Suit suit="diamonds" />
                </div>
              </div>
            </div>
            <div className="community">
              <div className="pot">
                <span className="eyebrow">
                  {result ? "HAND COMPLETE" : "POT"}
                </span>
                <strong
                  key={`${game.handNumber}-${result ? result.total : game.pot}`}
                  className="pot-amount"
                >
                  <ChipStack />
                  {number(result ? result.total : game.pot)}
                </strong>
              </div>
              <div className="community-cards">
                {Array.from({ length: 5 }, (_, i) => (
                  <Card
                    key={`${game.handNumber}-${i}-${!!game.board[i]}`}
                    card={game.board[i]}
                    ghost={!game.board[i]}
                    index={game.street === "flop" ? i : 0}
                    winner={isWinningCard(result, game.board[i])}
                  />
                ))}
              </div>
              {result ? (
                <div className="street-progress hand-complete-label">
                  {result.revealed ? "SHOWDOWN" : "HAND COMPLETE"}
                </div>
              ) : (
                <div className="street-progress">
                  {["preflop", "flop", "turn", "river"].map((street) => (
                    <span
                      className={game.street === street ? "active" : ""}
                      key={street}
                    >
                      {street === "preflop" ? "PRE-FLOP" : street.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {players.map((player, i) => {
              const originalIndex = game.players.findIndex(
                (p) => p.id === player.id,
              );
              const theta = Math.PI / 2 + (i * Math.PI * 2) / players.length;
              const x = 50 + 41 * Math.cos(theta),
                y = i === 0 ? 83 : 50 + 37 * Math.sin(theta);
              const acting = !result && game.actor === originalIndex;
              const self = player.id === playerId;
              const online = room.players.find(
                (p) => p.id === player.id,
              )?.connected;
              const won = result?.winners.find((p) => p.id === player.id);
              const reaction = reactions[player.id];
              const [phoneX, phoneY] =
                i === 0 ? [50, 83] : phoneSeats[players.length][i - 1];
              return (
                <div
                  key={player.id}
                  className={`table-seat ${self ? "self" : ""} ${phoneY <= 15 ? "phone-top" : ""} ${x > 65 ? "right-side" : ""} ${acting ? "acting" : ""} ${acting && seconds !== null && seconds <= 8 ? "urgent" : ""} ${player.folded ? "folded" : ""} ${won ? "winner" : ""}`}
                  style={{
                    "--seat-x": `${x}%`,
                    "--seat-y": `${y}%`,
                    "--phone-x": `${phoneX}%`,
                    "--phone-y": `${phoneY}%`,
                  }}
                >
                  {reaction && now - reaction.at < 3500 && (
                    <div className="reaction-bubble">
                      {reactionLabels[reaction.reaction]}
                    </div>
                  )}
                  <div className="seat-avatar-wrap">
                    <Avatar kind={player.avatar} />
                    {game.dealer === originalIndex && (
                      <span className="dealer-badge" title="Dealer">
                        D
                      </span>
                    )}
                    {acting && seconds !== null && (
                      <span
                        className={`turn-clock ${seconds <= 8 ? "urgent" : ""}`}
                        aria-label={`${seconds} seconds remaining`}
                      >
                        {seconds}
                      </span>
                    )}
                  </div>
                  <div className="seat-info">
                    <b title={player.name}>
                      {player.name}
                      {self && <small> YOU</small>}
                    </b>
                    <strong>
                      {number(player.chips)} <span>CHIPS</span>
                    </strong>
                    {acting && (
                      <div
                        className="turn-progress"
                        style={{
                          width:
                            seconds === null
                              ? "100%"
                              : `${Math.min(100, (seconds / room.settings.turnSeconds) * 100)}%`,
                        }}
                      />
                    )}
                  </div>
                  <div className="seat-cards">
                    {player.hand.map((card, n) => (
                      <Card
                        card={card}
                        key={`${game.handNumber}-${n}-${!!card}`}
                        index={n}
                        small={!self}
                        winner={isWinningCard(result, card, player.id)}
                      />
                    ))}
                  </div>
                  <div className="seat-action">
                    {!online && !player.isBot
                      ? "RECONNECTING"
                      : won
                        ? `+${number(won.amount)} ✦`
                        : player.eliminatedAt
                          ? "ELIMINATED"
                          : acting
                            ? self
                              ? "YOUR TURN"
                              : "TO ACT"
                            : player.allIn
                              ? "ALL IN"
                              : player.lastAction ||
                                (game.smallBlindSeat === originalIndex
                                  ? "SMALL BLIND"
                                  : game.bigBlindSeat === originalIndex
                                    ? "BIG BLIND"
                                    : acting
                                      ? "THINKING…"
                                      : "")}
                  </div>
                  {player.bet > 0 && (
                    <span className={`seat-bet ${y > 65 ? "above" : "below"}`}>
                      <ChipStack amount={2} />
                      {number(player.bet)}
                    </span>
                  )}
                </div>
              );
            })}
            <div className="table-caption">
              {nextSeconds !== null && (
                <span>
                  NEXT DEAL IN {nextSeconds}s{" "}
                  {room.hostId === playerId && (
                    <button
                      disabled={state.busy}
                      onClick={() => run(gameClient.next)}
                    >
                      DEAL NOW →
                    </button>
                  )}
                </span>
              )}
            </div>
          </div>
          {result && (
            <div className="compact-result">
              <HandResult
                result={result}
                players={game.players}
                key={game.handNumber}
              />
            </div>
          )}
          <Controls />
          <div className="last-event" role="status">
            {game.events.at(-1)?.text}
          </div>
        </section>
        <ChatPanel game />
      </div>
    </main>
  );
}

function HandResult({ result, players }) {
  return (
    <section className="hand-result" aria-label="Hand result">
      <div className="hand-result-heading">
        <span>{result.winners.length > 1 ? "POT WINNERS" : "HAND WINNER"}</span>
        <span>{number(result.total)} awarded</span>
      </div>
      <div className="hand-result-winners">
        {result.winners.map((winner) => (
          <div className="hand-result-player" key={winner.id}>
            <Avatar
              kind={players.find((player) => player.id === winner.id)?.avatar}
            />
            <div>
              <b title={winner.name}>{winner.name}</b>
              <small>{winner.handName}</small>
            </div>
            <strong>+{number(winner.amount)}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
