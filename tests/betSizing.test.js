import test from "node:test";
import assert from "node:assert/strict";
import {
  betLimits,
  parseBetAmount,
  potSizedTotal,
} from "../src/services/betSizing.js";

test("pot presets include the call and return a total for this betting round", () => {
  const game = { pot: 150, currentBet: 50 };
  const legal = { call: 30, minRaise: 90, maxRaise: 1000 };
  assert.equal(potSizedTotal(game, legal, 0.5), 140);
  assert.equal(potSizedTotal(game, legal, 1), 230);
  assert.equal(
    potSizedTotal(
      { pot: 101, currentBet: 0 },
      { ...legal, call: 0, minRaise: 10 },
      0.5,
    ),
    51,
  );
});

test("presets clamp to the full raise minimum or a short all-in maximum", () => {
  const game = { pot: 15, currentBet: 10 };
  assert.equal(
    potSizedTotal(game, { call: 0, minRaise: 20, maxRaise: 100 }, 0.5),
    20,
  );
  const shortStack = { call: 10, minRaise: 20, maxRaise: 16 };
  assert.deepEqual(betLimits(shortStack), { minimum: 16, maximum: 16 });
  assert.equal(potSizedTotal(game, shortStack, 1), 16);
  assert.equal(parseBetAmount("16", 16, 16).error, null);
  assert.equal(parseBetAmount("15", 16, 16).error, "low");
});

test("typed wagers reject empty, partial, fractional, unsafe, and out-of-range amounts", () => {
  for (const value of ["", "   "])
    assert.equal(parseBetAmount(value, 20, 1000).error, "empty");
  for (const value of [
    "1e2",
    "20.5",
    "-20",
    "abc",
    "1,000",
    "9007199254740992",
  ])
    assert.equal(parseBetAmount(value, 20, 1000).error, "integer");
  assert.equal(parseBetAmount("19", 20, 1000).error, "low");
  assert.equal(parseBetAmount("1001", 20, 1000).error, "high");
  for (const value of ["20", "0025", "1000"])
    assert.deepEqual(parseBetAmount(value, 20, 1000), {
      value: Number(value),
      error: null,
    });
});
