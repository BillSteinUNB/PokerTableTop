// Tiny, code-native pixel sprites: crisp at every scale, with no missing asset fallbacks.
const palettes = {
  fox: ["#f49b53", "#fff1ca", "#d67245"],
  bear: ["#b98767", "#edc19b", "#76544e"],
  cat: ["#b49be3", "#ead8ff", "#8669bb"],
  frog: ["#91ca78", "#dbf4b7", "#489e79"],
  owl: ["#d5ac77", "#fff0b9", "#97765e"],
  rabbit: ["#eec4d6", "#fff0ed", "#cb8faf"],
  raccoon: ["#a9bdcf", "#e7e4e5", "#697f99"],
  penguin: ["#738aa7", "#f4ead9", "#516681"],
};
export function Avatar({ kind = "fox", className = "", label }) {
  const [fur, face, shadow] = palettes[kind] || palettes.fox;
  return (
    <svg
      viewBox="0 0 32 32"
      className={`pixel-avatar ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      shapeRendering="crispEdges"
    >
      <path fill="#161727" d="M5 8h22v17h-3v4H8v-4H5z" />
      {kind === "rabbit" ? (
        <>
          <path fill={shadow} d="M8 1h5v12H8zM20 1h5v12h-5z" />
          <path fill={face} d="M10 2h2v8h-2zM21 2h2v8h-2z" />
        </>
      ) : kind === "frog" ? (
        <path fill={fur} d="M6 5h8v7H6zM19 5h8v7h-8z" />
      ) : (
        <path fill={shadow} d="M5 4h6v5h4v5H5zM27 4h-6v5h-4v5h10z" />
      )}
      <path fill={fur} d="M8 9h16v3h3v11h-3v4H8v-4H5V12h3z" />
      <path fill={shadow} d="M5 19h3v4h4v4H8v-4H5zM24 12h3v11h-3v4h-4v-3h4z" />
      <path
        fill={face}
        d={
          kind === "fox"
            ? "M7 16h5v3h8v-3h5v7h-4v3H11v-3H7z"
            : "M10 17h12v8H10z"
        }
      />
      {(kind === "raccoon" || kind === "penguin" || kind === "owl") && (
        <path fill={shadow} d="M7 12h8v7H7zM18 12h8v7h-8z" />
      )}
      <g className="sprite-eyes">
        <path fill="#22213b" d="M10 13h3v4h-3zM20 13h3v4h-3z" />
        <path fill="#fff8e3" d="M10 13h1v1h-1zM20 13h1v1h-1z" />
      </g>
      <path
        fill={kind === "penguin" || kind === "owl" ? "#f1b869" : "#563749"}
        d="M14 19h5v2h-5zM16 21h1v2h-1z"
      />
      <path fill="#ef94a4" opacity=".6" d="M7 18h3v2H7zM23 18h3v2h-3z" />
      {kind === "cat" && (
        <path stroke={shadow} d="M3 19h5m-5 3h6m17-3h4m-5 3h5" />
      )}
      <path fill={shadow} d="M10 28h12v4H10z" />
      <path fill={fur} d="M13 27h6v5h-6z" />
    </svg>
  );
}

const suitPaths = {
  spades:
    "M7 1h2v2h2v2h2v2h2v5h-2v2h-4v-3H7v3H3v-2H1V7h2V5h2V3h2zM7 13h2v2h2v1H5v-1h2z",
  hearts: "M3 2h3v2h4V2h3v2h2v5h-2v2h-2v2H9v2H7v-2H5v-2H3V9H1V4h2z",
  diamonds: "M7 1h2v3h2v2h2v2h2v1h-2v2h-2v2H9v3H7v-3H5v-2H3V9H1V8h2V6h2V4h2z",
  clubs:
    "M6 1h4v2h2v4h-2v2h2V7h3v2h1v4h-2v2h-4v-2H9v2h2v1H5v-1h2v-2H6v2H2v-2H0V9h1V7h3v2h2V7H4V3h2z",
};
export function Suit({ suit = "spades", className = "" }) {
  return (
    <svg
      className={`suit ${className}`}
      viewBox="0 0 16 17"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <path fill="currentColor" d={suitPaths[suit]} />
    </svg>
  );
}
export function Card({
  card,
  index = 0,
  small = false,
  ghost = false,
  winner = false,
}) {
  const red = card && ["hearts", "diamonds"].includes(card.suit);
  return (
    <div
      className={`playing-card ${small ? "small" : ""} ${ghost ? "ghost" : card ? "face" : "back"} ${red ? "red" : ""} ${winner ? "winning-card" : ""}`}
      style={{ "--card-index": index }}
      aria-label={
        ghost
          ? "Undealt community card"
          : card
            ? `${card.rank} of ${card.suit}`
            : "Hidden card"
      }
    >
      {card ? (
        <>
          <span className="card-corner">
            {card.rank}
            <Suit suit={card.suit} />
          </span>
          <Suit suit={card.suit} className="card-symbol" />
          <span className="card-corner bottom">
            {card.rank}
            <Suit suit={card.suit} />
          </span>
        </>
      ) : (
        <span className="back-symbol">{ghost ? "+" : <Suit />}</span>
      )}
    </div>
  );
}
export function ChipStack({ amount = 3 }) {
  return (
    <span className="chip-stack" aria-hidden="true">
      {Array.from({ length: Math.min(5, amount) }, (_, i) => (
        <i key={i} style={{ "--chip-index": i }} />
      ))}
    </span>
  );
}
