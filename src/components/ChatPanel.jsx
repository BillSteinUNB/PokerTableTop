import { useState, useRef, useEffect } from "react";
import { useTable, number, reactionLabels, run } from "../services/ui.js";
import { gameClient } from "../services/gameClient.js";
import { Card } from "./PixelArt.jsx";

export default function ChatPanel({ game = false }) {
  const state = useTable();
  const [tab, setTab] = useState("chat");
  const [message, setMessage] = useState("");
  const messages = useRef(null);
  useEffect(() => {
    if (messages.current)
      messages.current.scrollTop = messages.current.scrollHeight;
  }, [state.room.chat.length, tab]);
  return (
    <aside className="social-panel">
      <div className="panel-tabs">
        <button
          className={tab === "chat" ? "active" : ""}
          onClick={() => setTab("chat")}
        >
          CHAT
        </button>
        {game && (
          <button
            className={tab === "history" ? "active" : ""}
            onClick={() => setTab("history")}
          >
            HANDS <span>{state.game.history.length}</span>
          </button>
        )}
      </div>
      {tab === "chat" ? (
        <>
          <div
            className="chat-messages"
            ref={messages}
            role="log"
            aria-label="Table chat"
            aria-live="polite"
          >
            {state.room.chat.length === 0 && (
              <div className="chat-welcome">
                <p>
                  {state.mode === "practice"
                    ? "Chat is unavailable in practice."
                    : "No messages yet."}
                </p>
              </div>
            )}
            {state.room.chat.map((msg) => (
              <div
                className={`chat-message ${msg.playerId === state.playerId ? "mine" : ""}`}
                key={msg.id}
              >
                <b>{msg.name}</b>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>
          {game && (
            <div className="reactions">
              {["gg", "nice", "wow", "thinking"].map((key) => (
                <button
                  key={key}
                  aria-label={`React ${reactionLabels[key]}`}
                  title={reactionLabels[key]}
                  disabled={state.busy}
                  onClick={() => run(() => gameClient.react(key))}
                >
                  {reactionLabels[key]}
                </button>
              ))}
            </div>
          )}
          <form
            className="chat-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run(() => gameClient.chat(message))) setMessage("");
            }}
          >
            <input
              aria-label="Message the table"
              placeholder={
                state.mode === "practice"
                  ? "Chat unavailable"
                  : "Message the table…"
              }
              maxLength={240}
              value={message}
              disabled={state.mode === "practice"}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              aria-label="Send message"
              disabled={
                !message.trim() ||
                state.busy ||
                state.connection !== "connected"
              }
            >
              ↑
            </button>
          </form>
        </>
      ) : (
        <div className="history-list">
          {state.game.history.length === 0 ? (
            <p className="muted">
              The first hand is still playing. Completed hands will appear here.
            </p>
          ) : (
            state.game.history.map((hand) => (
              <details key={hand.handNumber}>
                <summary>
                  <span>HAND {String(hand.handNumber).padStart(2, "0")}</span>
                  <b>{hand.winners.map((p) => p.name).join(" + ")}</b>
                  <small>{number(hand.total)} in the pot</small>
                </summary>
                <div className="history-cards">
                  {hand.board.map((card, i) => (
                    <Card key={i} card={card} small />
                  ))}
                </div>
                {hand.events.map((event) => (
                  <p className="history-event" key={event.id}>
                    {event.text}
                  </p>
                ))}
              </details>
            ))
          )}
        </div>
      )}
      <div className="panel-note">
        <span className="status-dot" />{" "}
        {state.mode === "practice"
          ? "OFFLINE PRACTICE"
          : `ROOM ${state.room.code}`}
      </div>
    </aside>
  );
}
