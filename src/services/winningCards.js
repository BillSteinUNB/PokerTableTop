const sameCard = (a, b) => a && b && a.rank === b.rank && a.suit === b.suit;

// Only public showdown evaluations are eligible. With side pots, each winner
// can have a different best five; board highlights include all winning hands.
export function isWinningCard(result, card, playerId) {
  if (!result?.revealed || !card) return false;
  return result.winners.some(
    (winner) =>
      (playerId === undefined || winner.id === playerId) &&
      result.hands?.[winner.id]?.cards.some((winning) =>
        sameCard(winning, card),
      ),
  );
}
