/**
 * Deck Management Utilities for Texas Hold'em Poker
 */

const SUITS = ['spades', 'hearts', 'clubs', 'diamonds'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

/**
 * Create a standard 52-card deck
 * @returns {Array} Array of card objects with suit and rank
 */
export function createDeck() {
  const deck = [];

  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({ suit, rank });
    });
  });

  return deck;
}

/**
 * Shuffle a deck using Fisher-Yates algorithm
 * @param {Array} deck - Array of card objects
 * @returns {Array} Shuffled deck
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Deal cards from the top of the deck
 * @param {Array} deck - The deck to deal from
 * @param {number} numCards - Number of cards to deal
 * @returns {Object} Object with dealtCards array and remaining deck
 */
export function dealCards(deck, numCards) {
  const dealtCards = deck.slice(0, numCards);
  const remainingDeck = deck.slice(numCards);

  return {
    dealtCards,
    remainingDeck
  };
}

/**
 * Get numeric value of a rank for comparison
 * @param {string} rank - Card rank (2-10, J, Q, K, A)
 * @returns {number} Numeric value (2-14, where A=14)
 */
export function getRankValue(rank) {
  const rankValues = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
    '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };

  return rankValues[rank];
}

/**
 * Format a card for display
 * @param {Object} card - Card object with suit and rank
 * @returns {string} Formatted card string (e.g., "A♠")
 */
export function formatCard(card) {
  const suitSymbols = {
    spades: '♠',
    hearts: '♥',
    clubs: '♣',
    diamonds: '♦'
  };

  return `${card.rank}${suitSymbols[card.suit]}`;
}

/**
 * Format an array of cards for display
 * @param {Array} cards - Array of card objects
 * @returns {string} Formatted cards string
 */
export function formatCards(cards) {
  return cards.map(formatCard).join(' ');
}
