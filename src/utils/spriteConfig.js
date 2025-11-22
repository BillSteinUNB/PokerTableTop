/**
 * Sprite Configuration for Poker Game
 *
 * This module contains configuration for sprite sheets used in the game.
 * Sprite sheets are more efficient than individual images for games.
 */

// Card sprite configuration
// Layout: 4 rows of suits (Spades, Hearts, Clubs, Diamonds) + 1 row for card backs
// Each suit row has 13 columns (A, 2-10, J, Q, K)
export const CARD_SPRITE_CONFIG = {
  spriteSheetPath: '/assets/sprites/CardSprite.png',
  cardWidth: 190,     // Width of each card in pixels
  cardHeight: 265,    // Height of each card in pixels
  columns: 13,        // Number of cards per row (A-K)
  rows: 5,            // 4 suit rows + 1 card back row
  scale: 1,           // Scale factor for display

  // Map suits to row indices
  suits: {
    spades: 0,
    hearts: 1,
    clubs: 2,
    diamonds: 3
  },

  // Map ranks to column indices
  ranks: {
    'A': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5,
    '7': 6, '8': 7, '9': 8, '10': 9, 'J': 10, 'Q': 11, 'K': 12
  },

  // Card backs are in row 4
  cardBackRow: 4,

  // Different card back styles (columns in row 4)
  cardBackStyles: {
    classic: 0,
    red: 1,
    blue: 2,
    green: 3,
    purple: 4
  }
};

// Chip sprite configuration
// Each color has its own sprite sheet with 2 rows x 4 columns
// Row 0: Single chip, small stack, tall stack, angled stack
// Row 1: Large chip, two chips, short stack, scattered chips
export const CHIP_SPRITE_CONFIG = {
  chipWidth: 128,     // Width of each chip arrangement in pixels
  chipHeight: 128,    // Height of each chip arrangement in pixels
  columns: 4,         // Number of arrangements per row
  rows: 2,            // Number of rows
  scale: 1,           // Scale factor for display

  // Chip color files
  colors: {
    black: '/assets/sprites/BlackChips.jpg',
    red: '/assets/sprites/RedChips.jpg',
    blue: '/assets/sprites/BlueChips.jpg',
    green: '/assets/sprites/GreenChips.jpg',
    white: '/assets/sprites/WhiteChips.jpg'
  },

  // Chip arrangements by row/column
  arrangements: {
    singleChip: { row: 0, col: 0 },
    smallStack: { row: 0, col: 1 },
    tallStack: { row: 0, col: 2 },
    angledStack: { row: 0, col: 3 },
    largeChip: { row: 1, col: 0 },
    twoChips: { row: 1, col: 1 },
    shortStack: { row: 1, col: 2 },
    scattered: { row: 1, col: 3 }
  }
};

/**
 * Calculate sprite position for a card face
 * @param {string} suit - Card suit (spades, hearts, clubs, diamonds)
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
 * Calculate sprite position for a card back
 * @param {string} style - Card back style (classic, red, blue, green, purple)
 * @returns {Object} Position object with x, y coordinates
 */
export function getCardBackSpritePosition(style = 'classic') {
  const config = CARD_SPRITE_CONFIG;
  const col = config.cardBackStyles[style.toLowerCase()] || 0;
  const row = config.cardBackRow;

  return {
    x: col * config.cardWidth,
    y: row * config.cardHeight
  };
}

/**
 * Get chip sprite sheet path and position
 * @param {string} color - Chip color (black, red, blue, green, white)
 * @param {string} arrangement - Chip arrangement type (singleChip, smallStack, etc.)
 * @returns {Object} Sprite info with path and position
 */
export function getChipSpriteInfo(color = 'black', arrangement = 'singleChip') {
  const config = CHIP_SPRITE_CONFIG;
  const path = config.colors[color.toLowerCase()];
  const arr = config.arrangements[arrangement] || config.arrangements.singleChip;

  if (!path) {
    console.warn(`Invalid chip color: ${color}`);
    return {
      path: config.colors.black,
      x: 0,
      y: 0
    };
  }

  return {
    path,
    x: arr.col * config.chipWidth,
    y: arr.row * config.chipHeight
  };
}

/**
 * Get chip arrangement position (for existing single-sheet approach if needed)
 * @param {number} row - Row index (0-1)
 * @param {number} col - Column index (0-3)
 * @returns {Object} Position object with x, y coordinates
 */
export function getChipArrangementPosition(row, col) {
  const config = CHIP_SPRITE_CONFIG;

  return {
    x: col * config.chipWidth,
    y: row * config.chipHeight
  };
}
