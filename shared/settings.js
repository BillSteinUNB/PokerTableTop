export const DEFAULT_SETTINGS = Object.freeze({
  startingChips: 2000,
  smallBlind: 10,
  bigBlind: 20,
  maxPlayers: 6,
  turnSeconds: 30,
  blindIncreaseEvery: 10,
});

export function validateSettings(input = {}) {
  const value = { ...DEFAULT_SETTINGS };
  const ranges = {
    startingChips: [200, 100000],
    smallBlind: [1, 5000],
    bigBlind: [2, 10000],
    maxPlayers: [2, 8],
    turnSeconds: [15, 90],
    blindIncreaseEvery: [0, 50],
  };
  for (const [key, [min, max]] of Object.entries(ranges)) {
    if (input[key] === undefined) continue;
    if (
      !Number.isSafeInteger(input[key]) ||
      input[key] < min ||
      input[key] > max
    ) {
      throw new Error(
        `Invalid ${key}: use a whole number from ${min} to ${max}.`,
      );
    }
    value[key] = input[key];
  }
  if (value.bigBlind < value.smallBlind * 2)
    throw new Error("Big blind must be at least twice the small blind.");
  if (value.startingChips < value.bigBlind * 10)
    throw new Error("Starting stack must be at least 10 big blinds.");
  return value;
}

export const AVATARS = [
  "fox",
  "bear",
  "cat",
  "frog",
  "owl",
  "rabbit",
  "raccoon",
  "penguin",
];
export function validateProfile(input) {
  if (!input || typeof input.name !== "string")
    throw new Error("Enter a name for your seat.");
  const name = input.name
    .trim()
    .replace(/[\p{C}]/gu, "")
    .replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 18)
    throw new Error("Use a name between 2 and 18 characters.");
  return {
    name,
    avatar: AVATARS.includes(input.avatar) ? input.avatar : "fox",
  };
}
