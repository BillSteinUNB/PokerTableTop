export const DEAL_DURATION = 320;
export const DEAL_STAGGER = 70;
export const BOARD_STAGGER = 110;

export function captureDealState(game) {
  if (!game) return null;
  return {
    handNumber: game.handNumber,
    boardCount: game.board.length,
    street: game.street,
    dealer: game.dealer,
    players: game.players.map(({ id, hand }) => ({
      id,
      handCount: hand.length,
    })),
  };
}

export function planDeal(previous, game) {
  const current = captureDealState(game);
  if (!current) return [];

  if (!previous || previous.handNumber !== current.handNumber) {
    // A first snapshot after the flop already contains history, not a new deal.
    if (current.street !== "preflop" || current.boardCount) return [];
    const events = [];
    const seats = current.players.length;
    for (let round = 0; round < 2; round++) {
      for (let seat = 1; seat <= seats; seat++) {
        const player = current.players[(current.dealer + seat) % seats];
        if (player.handCount <= round) continue;
        events.push({
          key: `hole-${player.id}-${round}`,
          delay: events.length * DEAL_STAGGER,
        });
      }
    }
    return events;
  }

  // Hidden hole cards becoming visible at showdown are the same cards.
  return Array.from(
    { length: Math.max(0, current.boardCount - previous.boardCount) },
    (_, index) => ({
      key: `board-${previous.boardCount + index}`,
      delay: index * BOARD_STAGGER,
    }),
  );
}
