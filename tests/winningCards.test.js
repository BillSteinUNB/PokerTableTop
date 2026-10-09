import test from "node:test";
import assert from "node:assert/strict";
import { isWinningCard } from "../src/services/winningCards.js";

test("showdown highlights cover each side-pot winner without marking a losing seat", () => {
  const ace = { rank: "A", suit: "spades" };
  const king = { rank: "K", suit: "hearts" };
  const result = {
    revealed: true,
    winners: [{ id: "main" }, { id: "side" }],
    hands: {
      main: { cards: [ace] },
      side: { cards: [king] },
      loser: { cards: [ace] },
    },
  };
  assert.equal(isWinningCard(result, { ...ace }), true);
  assert.equal(isWinningCard(result, king), true);
  assert.equal(isWinningCard(result, king, "side"), true);
  assert.equal(isWinningCard(result, king, "main"), false);
  assert.equal(isWinningCard(result, ace, "loser"), false);
  assert.equal(isWinningCard(result, null), false);
  assert.equal(isWinningCard({ ...result, revealed: false }, ace), false);
  assert.equal(isWinningCard(null, ace), false);
});
