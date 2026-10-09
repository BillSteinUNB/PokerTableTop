import { CHARACTERS } from "../../shared/characters.js";

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

const characterIds = new Set(CHARACTERS.map(({ id }) => id));
const newSprites = {
  capybara: Capybara,
  axolotl: Axolotl,
  "red-panda": RedPanda,
  bat: Bat,
  dog: Dog,
  turtle: Turtle,
  skater: Skater,
  astronaut: Astronaut,
  punk: Punk,
  detective: Detective,
  coder: Coder,
  chef: Chef,
};

export function Avatar({ kind = "fox", className = "", label }) {
  const character = characterIds.has(kind) ? kind : "fox";
  const Sprite = newSprites[character];
  const blinkDelay = -(
    CHARACTERS.findIndex(({ id }) => id === character) * 0.37
  );
  return (
    <svg
      viewBox="0 0 32 32"
      className={`pixel-avatar ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      shapeRendering="crispEdges"
      style={{ "--blink-delay": `${blinkDelay}s` }}
    >
      {Sprite ? <Sprite /> : <LegacyFace kind={character} />}
    </svg>
  );
}

function LegacyFace({ kind }) {
  const [fur, face, shadow] = palettes[kind];
  return (
    <>
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
    </>
  );
}

function Eyes({ x = 10, y = 14, gap = 10, width = 3, height = 3 }) {
  return (
    <g className="sprite-eyes">
      <path
        fill="#22213b"
        d={`M${x} ${y}h${width}v${height}h-${width}zM${x + gap} ${y}h${width}v${height}h-${width}z`}
      />
      <path fill="#fff8e3" d={`M${x} ${y}h1v1h-1zM${x + gap} ${y}h1v1h-1z`} />
    </g>
  );
}

function Capybara() {
  return (
    <>
      <path fill="#282039" d="M5 8h5V5h6v4h7V7h5v8h2v11h-4v3H7v-3H3V14h2z" />
      <path
        fill="#aa805f"
        d="M6 7h6v7H6zM22 9h5v7h-5zM5 14h21v3h2v9h-5v2H9v-2H5zM10 27h13v5H10z"
      />
      <path
        fill="#d0a679"
        d="M8 10h3v4H8zM8 14h16v4h-2v3H7v-4h1zM8 20h19v5h-4v2H10v-2H8z"
      />
      <path
        fill="#846449"
        d="M5 21h3v5h3v2H8v-2H5zM22 27h3v5h-3zM10 30h12v2H10z"
      />
      <Eyes x={9} y={16} gap={11} width={2} height={2} />
      <path fill="#5d4544" d="M20 21h5v2h-5zM20 23h2v2h-2zM13 24h8v1h-8z" />
      <path fill="#ebc392" d="M13 28h6v2h-6z" />
    </>
  );
}

function Axolotl() {
  return (
    <>
      <path
        fill="#964d78"
        d="M1 6h3v4h4v3H4V12H1zM0 15h7v3H0zM2 23h3v-3h4v3H6v3H2zM31 6h-3v4h-4v3h4v-1h3zM25 15h7v3h-7zM30 23h-3v-3h-4v3h3v3h4z"
      />
      <path
        fill="#ed84b3"
        d="M3 6h2v4h3v2H5v-1H3zM1 14h6v2H1zM3 23h2v-3h3v2H6v3H3zM27 6h2v5h-2v1h-3v-2h3zM25 14h6v2h-6zM24 20h3v3h2v2h-3v-3h-2z"
      />
      <path
        fill="#5f405c"
        d="M10 8h12v2h4v4h2v10h-4v3h-3v5H11v-5H7v-3H4V14h2v-4h4z"
      />
      <path
        fill="#f0bfd7"
        d="M10 10h12v2h3v3h1v8h-4v3H10v-3H6v-8h1v-3h3zM12 26h8v6h-8z"
      />
      <path
        fill="#ffdfdf"
        d="M10 12h11v2H9v6H7v-5h1v-2h2zM10 21h12v3H10zM14 26h4v6h-4z"
      />
      <Eyes x={9} y={16} gap={11} width={2} />
      <path fill="#9d5477" d="M13 21h6v1h-6z" />
      <path fill="#e995bb" d="M7 20h4v2H7zM21 20h4v2h-4z" />
    </>
  );
}

function RedPanda() {
  return (
    <>
      <path
        fill="#382a36"
        d="M4 3h7v3h10V3h7v13h2v7h-3v4h-6v5H10v-5H5v-4H2v-7h2z"
      />
      <path fill="#fff0cf" d="M6 5h4v6H6zM22 5h4v6h-4z" />
      <path fill="#c36c45" d="M10 8h12v3h5v5h1v6h-4v4H8v-4H4v-6h1v-5h5z" />
      <path fill="#e99355" d="M10 8h11v3H9v5H6v-4h4zM12 11h8v4h-8z" />
      <path fill="#fff0cf" d="M5 15h8v4h6v-4h8v7h-4v3H9v-3H5z" />
      <path
        fill="#704b47"
        d="M8 13h6v5h-2v3H9v-3H8zM19 13h6v5h-2v3h-3v-3h-1z"
      />
      <Eyes x={9} y={14} gap={11} />
      <path fill="#382a36" d="M14 20h5v2h-5zM16 22h1v2h-1zM10 27h12v5H10z" />
      <path fill="#c36c45" d="M13 26h6v6h-6z" />
      <path fill="#edb184" d="M13 27h6v2h-6z" />
    </>
  );
}

function Bat() {
  return (
    <>
      <path
        fill="#28233c"
        d="M3 0h6v3h3v8h8V3h3V0h6v15h-2v8h-4v3h-2v6H11v-6H7v-3H5v-8H3zM0 20h4v3h4v8H5v-2H2v-3H0zM28 20h4v6h-2v3h-3v2h-3v-8h4z"
      />
      <path
        fill="#8973b6"
        d="M5 2h3v3h2v9H5zM24 2h3v12h-5V5h2zM10 11h12v3h4v7h-4v4H10v-4H6v-7h4zM12 25h8v7h-8z"
      />
      <path
        fill="#d292bd"
        d="M6 5h2v7H6zM24 5h2v7h-2zM2 23h2v3h3v3H5v-2H3v-2H2zM28 23h2v2h-1v2h-2v2h-2v-3h3z"
      />
      <path fill="#b3a0d4" d="M10 13h11v2H9v4H7v-4h3zM11 19h11v5H11z" />
      <Eyes x={9} y={15} gap={11} />
      <path fill="#443452" d="M13 20h7v2h-7z" />
      <path fill="#fff0d4" d="M13 21h2v3h-2zM18 21h2v3h-2z" />
    </>
  );
}

function Dog() {
  return (
    <>
      <path
        fill="#382c36"
        d="M8 5h16v3h5v4h2v11h-6v4h-5v5H11v-5H7v-4H1V12h2V8h5z"
      />
      <path
        fill="#936246"
        d="M4 10h6v13H3V13h1zM23 10h5v3h1v10h-7V10zM12 26h9v6h-9z"
      />
      <path fill="#e7ba7d" d="M9 7h14v4h2v12h-4v4H11v-4H7V11h2z" />
      <path fill="#b27c50" d="M8 11h7v8H8zM23 13h2v10h-4v4h-3v-3h3v-3h2z" />
      <path fill="#fff0ce" d="M16 8h3v10h-3zM12 18h10v6h-3v2h-5v-2h-2z" />
      <Eyes x={10} y={13} gap={10} />
      <path fill="#483442" d="M14 18h6v3h-6zM16 21h2v2h-2z" />
      <path fill="#e18c9b" d="M17 23h3v3h-3z" />
      <path fill="#779dac" d="M11 27h11v3H11z" />
      <path fill="#e7bf77" d="M15 29h4v3h-4z" />
    </>
  );
}

function Turtle() {
  return (
    <>
      <path
        fill="#293c3d"
        d="M9 4h14v3h4v5h2v10h-4v5h3v5H4v-5h4v-5H4V12h2V7h3z"
      />
      <path fill="#81b890" d="M10 6h12v3h4v5h1v7h-4v4H10v-4H6v-7h2V9h2z" />
      <path fill="#a9d39b" d="M11 8h10v2H10v5H8v-4h1V9h2zM10 19h13v4H10z" />
      <path
        fill="#589482"
        d="M24 11h2v10h-4v4h-3v-3h3v-3h2zM11 12h3v2h-3zM19 9h3v2h-3z"
      />
      <Eyes x={9} y={15} gap={12} width={2} />
      <path fill="#386359" d="M13 21h7v1h-7z" />
      <path fill="#657c50" d="M10 25h12v2h4v5H6v-5h4z" />
      <path fill="#bca979" d="M12 25h8v7h-8z" />
      <path fill="#8a8159" d="M12 28h8v1h-8zM16 25h1v7h-1z" />
      <path fill="#81b890" d="M5 28h5v4H5zM23 28h4v4h-4z" />
    </>
  );
}

function Skater() {
  return (
    <>
      <path fill="#24233a" d="M9 3h14v3h3v14h-3v6h4v6H5v-6h5v-3H7V9h2z" />
      <path fill="#d79569" d="M10 10h13v12h-3v4h-8v-4H9v-5H7v-4h3z" />
      <path fill="#ab6c50" d="M21 13h2v9h-3v4h-3v-3h3v-4h1zM8 14h2v3H8z" />
      <path fill="#754d42" d="M9 8h15v7h-3v-4H10v5H8v-4h1z" />
      <path fill="#639d9b" d="M10 3h11v2h3v5H8V6h2zM21 10h8v3h-8z" />
      <path fill="#9bd0b7" d="M10 5h9v2h-9zM8 9h16v2H8z" />
      <Eyes x={12} y={14} gap={7} width={2} />
      <path fill="#805247" d="M14 21h5v1h-5z" />
      <path fill="#c6a2ed" d="M10 26h3v2h6v-2h5v2h3v4H5v-4h5z" />
      <path fill="#9474c0" d="M10 27h2v5h-2zM21 27h2v5h-2z" />
      <path fill="#ebe0ff" d="M13 29h1v3h-1zM18 29h1v3h-1z" />
    </>
  );
}

function Astronaut() {
  return (
    <>
      <path
        fill="#33364e"
        d="M10 1h12v2h5v4h3v16h-4v3h-3v3h4v3H5v-3h4v-3H6v-3H2V7h3V3h5z"
      />
      <path
        fill="#b7c6cf"
        d="M10 3h12v2h4v4h2v12h-4v4H8v-4H4V9h2V5h4zM10 25h12v4h4v3H6v-3h4z"
      />
      <path
        fill="#eef0df"
        d="M10 3h11v2H9v2H7v4H5V8h1V5h4zM9 25h14v3H9zM8 29h16v3H8z"
      />
      <path fill="#536a89" d="M10 7h12v2h3v12h-3v2H10v-2H7V9h3z" />
      <path fill="#915e4a" d="M12 9h8v2h2v9h-3v2h-6v-2h-3v-9h2z" />
      <path fill="#c18563" d="M12 11h8v7h-2v3h-5v-3h-2v-6h1z" />
      <path fill="#453542" d="M12 8h8v3h-3v1h-3v-1h-3V9h1z" />
      <Eyes x={12} y={14} gap={6} width={2} height={2} />
      <path fill="#e3ac81" d="M14 19h4v1h-4z" />
      <path fill="#b1e5db" d="M8 10h2v5H8zM10 8h4v2h-4z" />
      <path fill="#cc9c6e" d="M24 12h3v6h-3z" />
      <path fill="#6a8b9d" d="M14 28h5v4h-5z" />
      <path fill="#b3dfb3" d="M15 29h2v1h-2z" />
    </>
  );
}

function Punk() {
  return (
    <>
      <path
        fill="#30243c"
        d="M12 0h8v4h3v4h3v13h-3v4h-2v2h5v5H5v-5h5v-3H7V11h3V4h2z"
      />
      <path fill="#ecc2a2" d="M10 9h13v13h-4v5h-7v-5H9v-5H7v-4h3z" />
      <path fill="#c88e84" d="M21 10h2v12h-4v5h-3v-3h3v-4h2zM8 14h2v3H8z" />
      <path fill="#9168b0" d="M11 9h4v5h-5v-2h1zM22 9h2v8h-2z" />
      <path fill="#e889b2" d="M13 1h5v4h3v5h-3v3h-5v-3h-2V5h2z" />
      <path fill="#ffc1cc" d="M14 2h2v6h-2zM13 8h2v3h-2z" />
      <Eyes x={12} y={15} gap={7} width={2} />
      <path fill="#915267" d="M14 21h5v2h-5z" />
      <path fill="#e6c36c" d="M7 18h2v3H7zM24 18h2v3h-2z" />
      <path fill="#625c83" d="M10 26h3v2h6v-2h4v2h3v4H5v-4h5z" />
      <path fill="#a9a0c7" d="M10 27h3v5h-2zM22 27h-3v5h2z" />
      <path fill="#e3c877" d="M8 29h2v1H8zM22 29h2v1h-2z" />
      <path fill="#30243c" d="M13 26h6v2h-6z" />
    </>
  );
}

function Detective() {
  return (
    <>
      <path
        fill="#292637"
        d="M9 2h13v3h3v5h5v4h-5v8h-4v4h5v3h2v3H4v-3h3v-3h5v-3H8v-9H2v-4h5V5h2z"
      />
      <path fill="#92634c" d="M10 12h13v10h-4v5h-6v-5h-3z" />
      <path fill="#bc8663" d="M11 13h9v6h-2v5h-4v-3h-3z" />
      <path fill="#b7a186" d="M10 3h11v3h3v5h5v2H3v-2h5V6h2z" />
      <path fill="#7d6b64" d="M10 4h10v2H10zM8 10h16v2H8z" />
      <path fill="#565168" d="M9 8h15v3H9z" />
      <Eyes x={11} y={15} gap={8} width={2} height={2} />
      <path fill="#49353b" d="M13 20h7v3h-2v1h-3v-1h-2z" />
      <path fill="#dbc296" d="M8 27h5v1h6v-1h5v2h3v3H5v-3h3z" />
      <path fill="#947963" d="M11 26h3l2 5-4-1zM21 26h-3l-2 5 5-1z" />
      <path fill="#eee4ce" d="M14 26h4v6h-4z" />
      <path fill="#8c6777" d="M15 28h2v4h-2z" />
    </>
  );
}

function Coder() {
  return (
    <>
      <path fill="#272538" d="M9 3h14v3h3v20h-4v2h4v4H5v-4h5v-2H6V7h3z" />
      <path fill="#785a50" d="M10 4h12v3h3v18h-4V12H9v13H7V8h3z" />
      <path fill="#f0d0b1" d="M10 10h12v12h-4v5h-6v-5h-3V12h1z" />
      <path fill="#d5aa93" d="M20 12h2v10h-4v5h-3v-3h3v-4h2z" />
      <path
        fill="#4d424b"
        d="M9 5h13v7h-3V9h-5v3H9zM7 20h3v6H7zM22 20h3v6h-3z"
      />
      <path fill="#bb9680" d="M10 6h6v2h-6z" />
      <path fill="#686b92" d="M8 13h7v6H8zM17 13h7v6h-7z" />
      <path fill="#dae1c9" d="M9 14h5v4H9zM18 14h5v4h-5z" />
      <path fill="#2e2c41" d="M14 14h4v2h-4z" />
      <Eyes x={11} y={15} gap={8} width={2} height={2} />
      <path fill="#bc8279" d="M13 21h5v1h-5z" />
      <path fill="#8cbaa6" d="M10 27h2v1h6v-1h5v2h3v3H5v-3h5z" />
      <path fill="#c8dfbb" d="M11 28h3v2h4v-2h3v4H11z" />
    </>
  );
}

function Chef() {
  return (
    <>
      <path
        fill="#302b3c"
        d="M10 0h12v2h5v4h2v7h-4v9h-4v4h4v3h3v3H4v-3h4v-3h4v-3H8V13H3V6h2V2h5z"
      />
      <path fill="#efebd9" d="M11 2h10v2h5v4h1v4H5V8h1V4h5zM9 11h15v4H9z" />
      <path
        fill="#c5c9cf"
        d="M8 7h2v5H8zM16 3h2v5h-2zM23 6h2v6h-2zM9 13h15v2H9z"
      />
      <path fill="#b67d5b" d="M10 15h13v7h-4v5h-6v-5h-3z" />
      <path fill="#dca47a" d="M10 15h10v4h-2v5h-4v-3h-4z" />
      <Eyes x={11} y={16} gap={8} width={2} height={2} />
      <path fill="#4e3940" d="M12 20h3v-1h3v1h3v2h-4v-1h-1v1h-4z" />
      <path fill="#e9e7d9" d="M9 27h14v2h4v3H5v-3h4z" />
      <path fill="#c38089" d="M12 25h3v2h3v-2h3v3h-4v4h-2v-4h-3z" />
      <path
        fill="#6e728a"
        d="M11 29h1v1h-1zM21 29h1v1h-1zM11 31h1v1h-1zM21 31h1v1h-1z"
      />
    </>
  );
}
