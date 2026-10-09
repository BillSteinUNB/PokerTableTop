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
      role="img"
      aria-label={
        ghost
          ? "Undealt community card"
          : card
            ? `${card.rank} of ${card.suit}`
            : "Hidden card"
      }
    >
      <svg
        className="card-art"
        viewBox="0 0 60 84"
        aria-hidden="true"
        shapeRendering="crispEdges"
      >
        {ghost ? (
          <>
            <path
              d="M3 1h54v2h2v78h-2v2H3v-2H1V3h2z"
              fill="#143d35"
              fillOpacity=".42"
              stroke="#74a18a"
              strokeOpacity=".3"
              strokeDasharray="3 4"
            />
            <path
              d="M26 41h8m-4-4v8"
              stroke="#8db79b"
              strokeOpacity=".25"
              strokeWidth="2"
            />
          </>
        ) : (
          <>
            <path d="M2 0h56v2h2v80h-2v2H2v-2H0V2h2z" fill="#d7d4c6" />
            <path d="M2 2h56v78H2z" fill="#fff9e9" />
            <path d="M2 80h56v2H2z" fill="#e9e0ca" />
            {card ? <CardFace card={card} /> : <CardBack />}
          </>
        )}
      </svg>
    </div>
  );
}

// The deck uses a single pixel grid, including the lettering. No font metrics
// or individually positioned HTML elements can shift its corners at small sizes.
const ranks = {
  A: ["01110", "11011", "10001", "10001", "11111", "10001", "10001"],
  2: ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  3: ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  5: ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
  6: ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  7: ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  8: ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  9: ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  10: [
    "010001110",
    "110010001",
    "010010001",
    "010010001",
    "010010001",
    "010010001",
    "111001110",
  ],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
};

const pips = {
  2: [
    [30, 24],
    [30, 60],
  ],
  3: [
    [30, 24],
    [30, 42],
    [30, 60],
  ],
  4: [
    [21, 24],
    [39, 24],
    [21, 60],
    [39, 60],
  ],
  5: [
    [21, 24],
    [39, 24],
    [30, 42],
    [21, 60],
    [39, 60],
  ],
  6: [
    [21, 24],
    [39, 24],
    [21, 42],
    [39, 42],
    [21, 60],
    [39, 60],
  ],
  7: [
    [21, 24],
    [39, 24],
    [30, 33],
    [21, 42],
    [39, 42],
    [21, 60],
    [39, 60],
  ],
  8: [
    [21, 24],
    [39, 24],
    [30, 33],
    [21, 42],
    [39, 42],
    [30, 51],
    [21, 60],
    [39, 60],
  ],
  9: [
    [21, 24],
    [39, 24],
    [21, 36],
    [39, 36],
    [30, 42],
    [21, 48],
    [39, 48],
    [21, 60],
    [39, 60],
  ],
  10: [
    [21, 24],
    [39, 24],
    [30, 30],
    [21, 36],
    [39, 36],
    [21, 48],
    [39, 48],
    [30, 54],
    [21, 60],
    [39, 60],
  ],
};

function DeckSuit({ suit, x, y, size = 9, inverted = false }) {
  return (
    <g
      transform={`translate(${x} ${y})${inverted ? " rotate(180)" : ""} scale(${size / 16}) translate(-8 -8)`}
    >
      <path fill="currentColor" d={suitPaths[suit]} />
    </g>
  );
}

function CardFace({ card }) {
  const rankPath = ranks[card.rank]
    .flatMap((row, y) =>
      [...row].flatMap((pixel, x) =>
        pixel === "1" ? [`M${x * 2} ${y * 2}h2v2h-2z`] : [],
      ),
    )
    .join("");
  const court = ["J", "Q", "K"].includes(card.rank);
  return (
    <g>
      {[false, true].map((inverted) => (
        <g
          key={String(inverted)}
          transform={inverted ? "translate(60 84) rotate(180)" : undefined}
        >
          <path d={rankPath} transform="translate(5 5)" fill="currentColor" />
          <DeckSuit suit={card.suit} x={9} y={25} size={8} />
        </g>
      ))}
      {card.rank === "A" ? (
        <>
          <path
            d="M30 21l17 21-17 21-17-21z"
            fill="none"
            stroke="currentColor"
            strokeOpacity=".15"
          />
          <DeckSuit suit={card.suit} x={30} y={42} size={24} />
        </>
      ) : court ? (
        <Court rank={card.rank} suit={card.suit} />
      ) : (
        pips[card.rank].map(([x, y], i) => (
          <DeckSuit key={i} suit={card.suit} x={x} y={y} inverted={y > 42} />
        ))
      )}
    </g>
  );
}

function Court({ rank, suit }) {
  return (
    <g>
      <path d="M17 18h26v48H17z" fill="currentColor" fillOpacity=".08" />
      <path
        d="M17 18h26v48H17zM19 42h22"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".4"
      />
      {[false, true].map((inverted) => (
        <g
          key={String(inverted)}
          transform={inverted ? "translate(60 84) rotate(180)" : undefined}
        >
          <path d="M21 39v-7h4v-5h10v5h4v7z" fill="currentColor" />
          <path d="M26 25h8v10h-8z" fill="#e5ba82" />
          <path d="M26 25h8v3h-8zM32 28h2v3h-2z" fill="#785044" />
          <path
            d={
              rank === "J"
                ? "M24 24h12v3H24zM27 21h9v3h-9zM34 18h3v3h-3z"
                : rank === "Q"
                  ? "M24 23h3v-3h2v3h2v-3h2v3h3v4H24z"
                  : "M23 21h3v3h3v-5h2v5h3v-3h3v7H23z"
            }
            fill="#caa559"
          />
          <path d="M29 29h2v2h-2z" fill="#332c40" />
          {rank === "K" && (
            <path d="M27 33h6v3h-2v2h-2v-2h-2z" fill="#785044" />
          )}
          <path d="M21 37h5v3h-5zM34 37h5v3h-5z" fill="#caa559" />
        </g>
      ))}
      <path d="M20 41h20v2H20z" fill="#fff9e9" />
      <DeckSuit suit={suit} x={30} y={42} size={7} />
    </g>
  );
}

function CardBack() {
  return (
    <g>
      <path d="M4 4h52v74H4z" fill="#45416c" />
      <path d="M7 7h46v68H7z" fill="none" stroke="#aba5d0" />
      {Array.from({ length: 8 }, (_, row) =>
        Array.from({ length: 5 }, (_, col) => (
          <path
            key={`${row}-${col}`}
            d={`M${10 + col * 9} ${10 + row * 8}h2v2h-2z`}
            fill="#79749e"
          />
        )),
      )}
      <path
        d="M30 20h3v5h5v5h5v5h4v14h-4v5h-5v5h-5v5h-6v-5h-5v-5h-5v-5h-4V35h4v-5h5v-5h5v-5z"
        fill="#2c2e50"
        stroke="#c8bae6"
        strokeWidth="2"
      />
      <g color="#c8bae6">
        <DeckSuit suit="spades" x={30} y={42} size={19} />
      </g>
      <path d="M11 12h4v2h-2v2h-2zM49 70h-4v-2h2v-2h2z" fill="#ddd0ea" />
    </g>
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
