export const SUITS = ["spades", "hearts", "clubs", "diamonds"];
export const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];
export const getRankValue = (rank) => RANKS.indexOf(rank) + 2;
export const createDeck = () =>
  SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));

// Rejection sampling avoids modulo bias; Web Crypto is available in Node 22+ and browsers.
function randomBelow(max) {
  const limit = Math.floor(0x100000000 / max) * max;
  const bytes = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(bytes);
  } while (bytes[0] >= limit);
  return bytes[0] % max;
}

export function shuffleDeck(deck = createDeck()) {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
