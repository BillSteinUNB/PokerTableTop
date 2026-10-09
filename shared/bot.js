import { evaluateHand } from "./handEvaluator.js";
import { getRankValue } from "./deck.js";

// Bots see only their own cards and the public board, exactly like a human client.
export function chooseBotAction(view, random = Math.random) {
  const p = view.players[view.actor];
  const legal = view.legal;
  const values = p.hand.map((c) => getRankValue(c.rank)).sort((a, b) => b - a);
  let strength = (values[0] + values[1]) / 38;
  if (values[0] === values[1]) strength += 0.28;
  if (p.hand[0].suit === p.hand[1].suit) strength += 0.08;
  if (view.board.length >= 3)
    strength = Math.min(
      0.98,
      evaluateHand([...p.hand, ...view.board]).ranking / 8 + strength * 0.28,
    );
  const pressure = legal.call / Math.max(1, p.chips);
  const roll = random();
  if (
    legal.canRaise &&
    legal.maxRaise >= legal.minRaise &&
    (strength > 0.78 || roll < 0.09)
  ) {
    const amount = Math.min(
      legal.maxRaise,
      Math.max(legal.minRaise, view.currentBet + Math.ceil(view.pot * 0.55)),
    );
    return { action: "raise", amount };
  }
  if (legal.canCheck) return { action: "check" };
  if (strength + roll * 0.3 > 0.42 + pressure * 0.55) return { action: "call" };
  return { action: "fold" };
}
