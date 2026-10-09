import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SETTINGS } from "../shared/settings.js";
import {
  readTablePreferences,
  saveTablePreferences,
} from "../src/services/tablePreferences.js";

function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
  };
}

test("saved table preferences retain every setting for the next room", () => {
  const storage = memoryStorage();
  assert.equal(readTablePreferences(storage), null);
  const settings = {
    startingChips: 4000,
    smallBlind: 25,
    bigBlind: 50,
    maxPlayers: 8,
    turnSeconds: 60,
    blindIncreaseEvery: 0,
  };
  saveTablePreferences(settings, storage);
  assert.deepEqual(readTablePreferences(storage), settings);
  saveTablePreferences(DEFAULT_SETTINGS, storage);
  assert.deepEqual(readTablePreferences(storage), DEFAULT_SETTINGS);
});

test("corrupt, incomplete, obsolete, or illegal preferences fall back safely", () => {
  const invalid = [
    "{broken",
    "null",
    JSON.stringify({ version: 2, settings: DEFAULT_SETTINGS }),
    JSON.stringify({ version: 1, settings: { startingChips: 4000 } }),
    JSON.stringify({
      version: 1,
      settings: { ...DEFAULT_SETTINGS, startingChips: "4000" },
    }),
    JSON.stringify({
      version: 1,
      settings: { ...DEFAULT_SETTINGS, smallBlind: 15, bigBlind: 20 },
    }),
    JSON.stringify({
      version: 1,
      settings: { ...DEFAULT_SETTINGS, bigBlind: 500 },
    }),
  ];
  for (const value of invalid) {
    assert.equal(readTablePreferences(memoryStorage(value)), null);
  }
});

test("unavailable storage and invalid writes do not interrupt room setup", () => {
  const unavailable = {
    getItem: () => {
      throw new Error("Storage is disabled");
    },
    setItem: () => {
      throw new Error("Storage is full");
    },
  };
  assert.equal(readTablePreferences(unavailable), null);
  assert.doesNotThrow(() =>
    saveTablePreferences(DEFAULT_SETTINGS, unavailable),
  );
  const storage = memoryStorage();
  saveTablePreferences(DEFAULT_SETTINGS, storage);
  saveTablePreferences({ ...DEFAULT_SETTINGS, maxPlayers: 99 }, storage);
  assert.deepEqual(readTablePreferences(storage), DEFAULT_SETTINGS);
});
