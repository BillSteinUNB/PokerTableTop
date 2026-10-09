import { useState, useRef, useLayoutEffect, useId } from "react";
import { useTable, number, reactionLabels, run } from "../services/ui.js";
import { gameClient } from "../services/gameClient.js";
import { Card } from "./PixelArt.jsx";
import "./ChatPanel.css";

export default function ChatPanel({ game = false }) {
  const state = useTable();
  const practice = state.mode === "practice";
  const [tab, setTab] = useState(practice && game ? "history" : "chat");
  const [message, setMessage] = useState("");
  const [unread, setUnread] = useState(0);
  const messages = useRef(null);
  const pinned = useRef(true);
  const chatSize = useRef({ width: 0, height: 0 });
  const previousMessage = useRef(state.room.chat.at(-1)?.id);
  const tabButtons = useRef({});
  const id = useId();
  const availableTabs =
    practice && game ? ["history"] : game ? ["chat", "history"] : ["chat"];

  const scrollToLatest = () => {
    const log = messages.current;
    if (log) log.scrollTop = log.scrollHeight;
    pinned.current = true;
    setUnread(0);
  };

  useLayoutEffect(() => {
    const chat = state.room.chat;
    const lastId = chat.at(-1)?.id;
    if (lastId !== previousMessage.current) {
      const previousIndex = chat.findIndex(
        (msg) => msg.id === previousMessage.current,
      );
      const incoming = chat
        .slice(previousIndex + 1)
        .filter((msg) => msg.playerId !== state.playerId);
      if (tab !== "chat" || !pinned.current)
        setUnread((count) => count + incoming.length);
      previousMessage.current = lastId;
    }
    if (tab === "chat" && pinned.current) scrollToLatest();
  }, [state.room.chat, state.playerId, tab]);

  useLayoutEffect(() => {
    const log = messages.current;
    if (!log) return;
    // Keep the latest message visible when a phone rotates or its keyboard opens.
    const observer = new ResizeObserver(() => {
      if (!log.clientHeight) return;
      chatSize.current = { width: log.clientWidth, height: log.clientHeight };
      if (pinned.current) log.scrollTop = log.scrollHeight;
    });
    observer.observe(log);
    return () => observer.disconnect();
  }, []);

  const selectWithKeyboard = (event) => {
    const current = availableTabs.indexOf(tab);
    const next =
      event.key === "ArrowRight"
        ? (current + 1) % availableTabs.length
        : event.key === "ArrowLeft"
          ? (current + availableTabs.length - 1) % availableTabs.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? availableTabs.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    setTab(availableTabs[next]);
    tabButtons.current[availableTabs[next]]?.focus();
  };

  return (
    <aside className="social-panel" aria-label="Table activity">
      <div
        className="panel-tabs"
        role="tablist"
        aria-label="Table activity"
        onKeyDown={selectWithKeyboard}
      >
        {availableTabs.map((name) => (
          <button
            key={name}
            ref={(button) => {
              tabButtons.current[name] = button;
            }}
            id={`${id}-${name}-tab`}
            role="tab"
            aria-selected={tab === name}
            aria-controls={`${id}-${name}-panel`}
            tabIndex={tab === name ? 0 : -1}
            className={tab === name ? "active" : ""}
            onClick={() => setTab(name)}
          >
            {name === "chat" ? "CHAT" : "HANDS"}{" "}
            {name === "history" && <span>{state.game.history.length}</span>}
            {name === "chat" && unread > 0 && (
              <span
                className="unread-count"
                aria-label={`${unread} unread messages`}
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
        ))}
      </div>
      {!practice && (
        <div
          className="social-tabpanel"
          role="tabpanel"
          id={`${id}-chat-panel`}
          aria-labelledby={`${id}-chat-tab`}
          hidden={tab !== "chat"}
        >
          <div className="chat-scroll-area">
            <div
              className="chat-messages"
              ref={messages}
              role="log"
              aria-label="Table chat"
              aria-live={tab === "chat" ? "polite" : "off"}
              tabIndex={0}
              onScroll={(event) => {
                const log = event.currentTarget;
                if (tab !== "chat" || !log.clientHeight) return;
                if (
                  log.clientWidth !== chatSize.current.width ||
                  log.clientHeight !== chatSize.current.height
                )
                  return;
                pinned.current =
                  log.scrollHeight - log.scrollTop - log.clientHeight < 36;
                if (pinned.current) setUnread(0);
              }}
            >
              {state.room.chat.length === 0 && (
                <div className="chat-welcome">
                  <p>No messages yet.</p>
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
            {unread > 0 && (
              <button className="chat-new-messages" onClick={scrollToLatest}>
                New messages <span aria-hidden="true">↓</span>
              </button>
            )}
          </div>
          <form
            className="chat-form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (
                !message.trim() ||
                state.busy ||
                state.connection !== "connected"
              )
                return;
              const sent = message;
              if (await run(() => gameClient.chat(sent))) {
                setMessage((draft) => (draft === sent ? "" : draft));
                scrollToLatest();
              }
            }}
          >
            <input
              aria-label="Message the table"
              placeholder="Message the table…"
              maxLength={240}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
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
        </div>
      )}
      {game && (
        <div
          className="social-tabpanel"
          role="tabpanel"
          id={`${id}-history-panel`}
          aria-labelledby={`${id}-history-tab`}
          hidden={tab !== "history"}
        >
          <div
            className="history-list"
            tabIndex={0}
            aria-label="Completed hands"
          >
            {state.game.history.length === 0 ? (
              <div className="history-empty">
                <svg
                  viewBox="0 0 56 40"
                  aria-hidden="true"
                  shapeRendering="crispEdges"
                >
                  <path
                    d="M7 9h23v27H7z"
                    fill="#282536"
                    stroke="#655c79"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 4h24v28H18z"
                    fill="#353047"
                    stroke="#9c8db7"
                    strokeWidth="2"
                  />
                  <path
                    d="M28 10h4v3h3v3h3v4h-3v3h-3v3h-4v-3h-3v-3h-3v-4h3v-3h3z"
                    fill="#b9a1f2"
                  />
                  <path d="M44 7h6v2h-6zM46 13h6v2h-6z" fill="#655c79" />
                </svg>
                <b>No completed hands</b>
                <p>Finished hands appear here.</p>
              </div>
            ) : (
              state.game.history.map((hand) => (
                <details key={hand.handNumber}>
                  <summary>
                    <span>HAND {String(hand.handNumber).padStart(2, "0")}</span>
                    <b>
                      {hand.winners.map((player) => player.name).join(" + ")}
                    </b>
                    <small>{number(hand.total)} in the pot</small>
                  </summary>
                  <div className="history-cards">
                    {hand.board.map((card, index) => (
                      <Card key={index} card={card} small />
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
        </div>
      )}
      {game && (
        <div className="reactions" aria-label="Table reactions">
          {["gg", "nice", "wow", "thinking"].map((key) => (
            <button
              key={key}
              aria-label={`React ${reactionLabels[key]}`}
              title={reactionLabels[key]}
              disabled={
                state.busy || (!practice && state.connection !== "connected")
              }
              onClick={() => run(() => gameClient.react(key))}
            >
              {reactionLabels[key]}
            </button>
          ))}
        </div>
      )}
      <div className="panel-note">
        <span className="status-dot" />{" "}
        {practice ? "OFFLINE PRACTICE" : `ROOM ${state.room.code}`}
      </div>
    </aside>
  );
}
