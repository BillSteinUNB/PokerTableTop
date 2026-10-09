/**
 * Poker Hand Evaluation for Texas Hold'em
 * Evaluates the best 5-card hand from 7 cards (2 hole + 5 community)
 */

import { getRankValue } from "./deck.js";

// Hand rankings (higher is better)
export const HAND_RANKINGS = {
  HIGH_CARD: 1,
  ONE_PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10,
};

export const HAND_NAMES = {
  1: "High Card",
  2: "One Pair",
  3: "Two Pair",
  4: "Three of a Kind",
  5: "Straight",
  6: "Flush",
  7: "Full House",
  8: "Four of a Kind",
  9: "Straight Flush",
  10: "Royal Flush",
};

/**
 * Evaluate the best poker hand from given cards
 * @param {Array} cards - Array of card objects (can be 5, 6, or 7 cards)
 * @returns {Object} Hand evaluation with ranking, name, and tiebreakers
 */
export function evaluateHand(cards) {
  if (!cards || cards.length < 5) {
    return {
      ranking: 0,
      name: "Invalid Hand",
      cards: [],
      tiebreakers: [],
    };
  }

  // If more than 5 cards, find the best 5-card combination
  if (cards.length > 5) {
    return findBestHand(cards);
  }

  // Evaluate the 5-card hand
  return evaluate5CardHand(cards);
}

/**
 * Find the best 5-card hand from 6 or 7 cards
 * @param {Array} cards - Array of 6 or 7 cards
 * @returns {Object} Best hand evaluation
 */
function findBestHand(cards) {
  const combinations = getCombinations(cards, 5);
  let bestHand = null;

  combinations.forEach((combo) => {
    const evaluation = evaluate5CardHand(combo);
    if (!bestHand || compareHands(evaluation, bestHand) > 0) {
      bestHand = evaluation;
    }
  });

  return bestHand;
}

/**
 * Generate all combinations of k elements from array
 * @param {Array} arr - Source array
 * @param {number} k - Number of elements to choose
 * @returns {Array} Array of combinations
 */
function getCombinations(arr, k) {
  if (k === 1) return arr.map((el) => [el]);
  if (k === arr.length) return [arr];

  const combinations = [];

  for (let i = 0; i <= arr.length - k; i++) {
    const head = arr[i];
    const tailCombos = getCombinations(arr.slice(i + 1), k - 1);
    tailCombos.forEach((combo) => {
      combinations.push([head, ...combo]);
    });
  }

  return combinations;
}

/**
 * Evaluate a 5-card poker hand
 * @param {Array} cards - Exactly 5 cards
 * @returns {Object} Hand evaluation
 */
function evaluate5CardHand(cards) {
  // Sort cards by rank value (descending)
  const sortedCards = [...cards].sort(
    (a, b) => getRankValue(b.rank) - getRankValue(a.rank),
  );

  // Check for each hand type (from highest to lowest)
  const royalFlush = checkRoyalFlush(sortedCards);
  if (royalFlush) return royalFlush;

  const straightFlush = checkStraightFlush(sortedCards);
  if (straightFlush) return straightFlush;

  const fourOfAKind = checkFourOfAKind(sortedCards);
  if (fourOfAKind) return fourOfAKind;

  const fullHouse = checkFullHouse(sortedCards);
  if (fullHouse) return fullHouse;

  const flush = checkFlush(sortedCards);
  if (flush) return flush;

  const straight = checkStraight(sortedCards);
  if (straight) return straight;

  const threeOfAKind = checkThreeOfAKind(sortedCards);
  if (threeOfAKind) return threeOfAKind;

  const twoPair = checkTwoPair(sortedCards);
  if (twoPair) return twoPair;

  const onePair = checkOnePair(sortedCards);
  if (onePair) return onePair;

  return checkHighCard(sortedCards);
}

/**
 * Group cards by rank
 * @param {Array} cards - Array of cards
 * @returns {Object} Object with ranks as keys and arrays of cards as values
 */
function groupByRank(cards) {
  const groups = {};

  cards.forEach((card) => {
    if (!groups[card.rank]) {
      groups[card.rank] = [];
    }
    groups[card.rank].push(card);
  });

  return groups;
}

/**
 * Check if all cards are the same suit
 * @param {Array} cards - Array of cards
 * @returns {boolean} True if all same suit
 */
function isFlush(cards) {
  const firstSuit = cards[0].suit;
  return cards.every((card) => card.suit === firstSuit);
}

/**
 * Check if cards form a straight
 * @param {Array} cards - Array of cards sorted by rank
 * @returns {boolean|number} False if not straight, or high card value if straight
 */
function isStraight(cards) {
  const values = cards.map((card) => getRankValue(card.rank));

  // Check for regular straight
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - values[i + 1] !== 1) {
      // Check for A-2-3-4-5 (wheel) straight
      if (
        i === 0 &&
        values[0] === 14 &&
        values[1] === 5 &&
        values[2] === 4 &&
        values[3] === 3 &&
        values[4] === 2
      ) {
        return 5; // In wheel straight, 5 is high card
      }
      return false;
    }
  }

  return values[0]; // High card of the straight
}

// Hand checking functions
function checkRoyalFlush(cards) {
  if (!isFlush(cards)) return null;

  const straightHigh = isStraight(cards);
  if (straightHigh === 14) {
    // Ace-high straight flush
    return {
      ranking: HAND_RANKINGS.ROYAL_FLUSH,
      name: HAND_NAMES[HAND_RANKINGS.ROYAL_FLUSH],
      cards,
      tiebreakers: [14], // Royal flush always has Ace high
    };
  }

  return null;
}

function checkStraightFlush(cards) {
  if (!isFlush(cards)) return null;

  const straightHigh = isStraight(cards);
  if (straightHigh) {
    return {
      ranking: HAND_RANKINGS.STRAIGHT_FLUSH,
      name: HAND_NAMES[HAND_RANKINGS.STRAIGHT_FLUSH],
      cards,
      tiebreakers: [straightHigh],
    };
  }

  return null;
}

function checkFourOfAKind(cards) {
  const groups = groupByRank(cards);
  const ranks = Object.keys(groups);

  for (const rank of ranks) {
    if (groups[rank].length === 4) {
      const kicker = cards.find((card) => card.rank !== rank);

      return {
        ranking: HAND_RANKINGS.FOUR_OF_A_KIND,
        name: HAND_NAMES[HAND_RANKINGS.FOUR_OF_A_KIND],
        cards,
        tiebreakers: [getRankValue(rank), getRankValue(kicker.rank)],
      };
    }
  }

  return null;
}

function checkFullHouse(cards) {
  const groups = groupByRank(cards);
  const ranks = Object.keys(groups);

  let threeRank = null;
  let pairRank = null;

  for (const rank of ranks) {
    if (groups[rank].length === 3) {
      threeRank = rank;
    } else if (groups[rank].length === 2) {
      pairRank = rank;
    }
  }

  if (threeRank && pairRank) {
    return {
      ranking: HAND_RANKINGS.FULL_HOUSE,
      name: HAND_NAMES[HAND_RANKINGS.FULL_HOUSE],
      cards,
      tiebreakers: [getRankValue(threeRank), getRankValue(pairRank)],
    };
  }

  return null;
}

function checkFlush(cards) {
  if (isFlush(cards)) {
    const values = cards
      .map((card) => getRankValue(card.rank))
      .sort((a, b) => b - a);

    return {
      ranking: HAND_RANKINGS.FLUSH,
      name: HAND_NAMES[HAND_RANKINGS.FLUSH],
      cards,
      tiebreakers: values,
    };
  }

  return null;
}

function checkStraight(cards) {
  const straightHigh = isStraight(cards);

  if (straightHigh) {
    return {
      ranking: HAND_RANKINGS.STRAIGHT,
      name: HAND_NAMES[HAND_RANKINGS.STRAIGHT],
      cards,
      tiebreakers: [straightHigh],
    };
  }

  return null;
}

function checkThreeOfAKind(cards) {
  const groups = groupByRank(cards);
  const ranks = Object.keys(groups);

  for (const rank of ranks) {
    if (groups[rank].length === 3) {
      const kickers = cards
        .filter((card) => card.rank !== rank)
        .map((card) => getRankValue(card.rank))
        .sort((a, b) => b - a);

      return {
        ranking: HAND_RANKINGS.THREE_OF_A_KIND,
        name: HAND_NAMES[HAND_RANKINGS.THREE_OF_A_KIND],
        cards,
        tiebreakers: [getRankValue(rank), ...kickers],
      };
    }
  }

  return null;
}

function checkTwoPair(cards) {
  const groups = groupByRank(cards);
  const ranks = Object.keys(groups);

  const pairs = ranks.filter((rank) => groups[rank].length === 2);

  if (pairs.length === 2) {
    const pairValues = pairs
      .map((rank) => getRankValue(rank))
      .sort((a, b) => b - a);
    const kicker = cards.find((card) => !pairs.includes(card.rank));

    return {
      ranking: HAND_RANKINGS.TWO_PAIR,
      name: HAND_NAMES[HAND_RANKINGS.TWO_PAIR],
      cards,
      tiebreakers: [...pairValues, getRankValue(kicker.rank)],
    };
  }

  return null;
}

function checkOnePair(cards) {
  const groups = groupByRank(cards);
  const ranks = Object.keys(groups);

  for (const rank of ranks) {
    if (groups[rank].length === 2) {
      const kickers = cards
        .filter((card) => card.rank !== rank)
        .map((card) => getRankValue(card.rank))
        .sort((a, b) => b - a);

      return {
        ranking: HAND_RANKINGS.ONE_PAIR,
        name: HAND_NAMES[HAND_RANKINGS.ONE_PAIR],
        cards,
        tiebreakers: [getRankValue(rank), ...kickers],
      };
    }
  }

  return null;
}

function checkHighCard(cards) {
  const values = cards
    .map((card) => getRankValue(card.rank))
    .sort((a, b) => b - a);

  return {
    ranking: HAND_RANKINGS.HIGH_CARD,
    name: HAND_NAMES[HAND_RANKINGS.HIGH_CARD],
    cards,
    tiebreakers: values,
  };
}

/**
 * Compare two poker hands
 * @param {Object} hand1 - First hand evaluation
 * @param {Object} hand2 - Second hand evaluation
 * @returns {number} 1 if hand1 wins, -1 if hand2 wins, 0 for tie
 */
export function compareHands(hand1, hand2) {
  // Compare rankings first
  if (hand1.ranking > hand2.ranking) return 1;
  if (hand1.ranking < hand2.ranking) return -1;

  // Same ranking, compare tiebreakers
  for (let i = 0; i < hand1.tiebreakers.length; i++) {
    if (hand1.tiebreakers[i] > hand2.tiebreakers[i]) return 1;
    if (hand1.tiebreakers[i] < hand2.tiebreakers[i]) return -1;
  }

  // Complete tie
  return 0;
}

/**
 * Determine winner(s) from array of players
 * @param {Array} players - Array of player objects with hand property
 * @param {Array} communityCards - Community cards on the table
 * @returns {Object} Object with winners array and winning hand info
 */
export function determineWinner(players, communityCards) {
  const activePlayers = players.filter((p) => !p.folded && p.hand);

  if (activePlayers.length === 0) {
    return { winners: [], winningHand: null };
  }

  if (activePlayers.length === 1) {
    const player = activePlayers[0];
    const allCards = [...player.hand, ...communityCards];
    const handEval = evaluateHand(allCards);

    return {
      winners: [player],
      winningHand: handEval,
    };
  }

  // Evaluate all hands
  const evaluations = activePlayers.map((player) => {
    const allCards = [...player.hand, ...communityCards];
    return {
      player,
      handEval: evaluateHand(allCards),
    };
  });

  // Find the best hand
  let bestEval = evaluations[0];
  evaluations.forEach((evalData) => {
    if (compareHands(evalData.handEval, bestEval.handEval) > 0) {
      bestEval = evalData;
    }
  });

  // Find all players with the best hand (for split pots)
  const winners = evaluations
    .filter(
      (evalData) => compareHands(evalData.handEval, bestEval.handEval) === 0,
    )
    .map((evalData) => evalData.player);

  return {
    winners,
    winningHand: bestEval.handEval,
  };
}
