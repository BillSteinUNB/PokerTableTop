export function betLimits(legal) {
  return {
    minimum: Math.min(legal.minRaise, legal.maxRaise),
    maximum: legal.maxRaise,
  };
}

export function potSizedTotal(game, legal, fraction) {
  const { minimum, maximum } = betLimits(legal);
  // A pot-sized raise includes the call before calculating the raise itself.
  const total = game.currentBet + Math.ceil((game.pot + legal.call) * fraction);
  return Math.max(minimum, Math.min(maximum, total));
}

export function parseBetAmount(raw, minimum, maximum) {
  const text = String(raw).trim();
  const value = Number(text);
  const error = !text
    ? "empty"
    : !/^\d+$/.test(text) || !Number.isSafeInteger(value)
      ? "integer"
      : value < minimum
        ? "low"
        : value > maximum
          ? "high"
          : null;
  return { value, error };
}
