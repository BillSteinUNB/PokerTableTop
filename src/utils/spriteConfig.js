/**
 * Sprite Configuration for Poker Game
 *
 * This module contains configuration for sprite sheets used in the game.
 * Sprite sheets are more efficient than individual images for games.
 */

// Card sprite configuration
// Assumes a sprite sheet with cards arranged in a grid
export const CARD_SPRITE_CONFIG = {
  spriteSheetPath: '/assets/sprites/cards.png',
  cardWidth: 64,      // Width of each card in pixels
  cardHeight: 89,     // Height of each card in pixels
  columns: 13,        // Number of cards per row (A-K)
  rows: 4,            // Number of rows (suits: hearts, diamonds, clubs, spades)
  scale: 1,           // Scale factor for display

  // Map suits to row indices
  suits: {
    hearts: 0,
    diamonds: 1,
    clubs: 2,
    spades: 3
  },

  // Map ranks to column indices
  ranks: {
    'A': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5,
    '7': 6, '8': 7, '9': 8, '10': 9, 'J': 10, 'Q': 11, 'K': 12
  }
};

// Chip sprite configuration
// Assumes a sprite sheet with different chip denominations
export const CHIP_SPRITE_CONFIG = {
  spriteSheetPath: '/assets/sprites/chips.png',
  chipWidth: 32,      // Width of each chip in pixels
  chipHeight: 32,     // Height of each chip in pixels
  columns: 5,         // Number of chip types
  rows: 1,            // Single row of chips
  scale: 1,           // Scale factor for display

  // Map chip values to column indices
  denominations: {
    1: 0,      // White chip
    5: 1,      // Red chip
    10: 2,     // Blue chip
    25: 3,     // Green chip
    100: 4     // Black chip
  }
};

/**
 * Calculate sprite position for a card
 * @param {string} suit - Card suit (hearts, diamonds, clubs, spades)
 * @param {string} rank - Card rank (A, 2-10, J, Q, K)
 * @returns {Object} Position object with x, y coordinates
 */
export function getCardSpritePosition(suit, rank) {
  const config = CARD_SPRITE_CONFIG;
  const row = config.suits[suit.toLowerCase()];
  const col = config.ranks[rank.toUpperCase()];

  if (row === undefined || col === undefined) {
    console.warn(`Invalid card: ${rank} of ${suit}`);
    return { x: 0, y: 0 };
  }

  return {
    x: col * config.cardWidth,
    y: row * config.cardHeight
  };
}

/**
 * Calculate sprite position for a chip
 * @param {number} value - Chip denomination
 * @returns {Object} Position object with x, y coordinates
 */
export function getChipSpritePosition(value) {
  const config = CHIP_SPRITE_CONFIG;
  const col = config.denominations[value];

  if (col === undefined) {
    console.warn(`Invalid chip denomination: ${value}`);
    return { x: 0, y: 0 };
  }

  return {
    x: col * config.chipWidth,
    y: 0
  };
}
