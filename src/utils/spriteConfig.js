/**
 * Sprite Configuration for Poker Game
 *
 * This module contains configuration for individual sprite images used in the game.
 * Uses sliced sprites instead of sprite sheets for easier management.
 */

// Card image configuration
// Individual card images named like: aceSpade.png, twoHeart.png, kingDiamond.png
export const CARD_SPRITE_CONFIG = {
  cardWidth: 190,     // Width of each card in pixels
  cardHeight: 265,    // Height of each card in pixels

  // Base path for card images
  basePath: '/assets/sprites/cards/',

  // Card back base path
  cardBackPath: '/assets/sprites/cardbacks/',

  // Map ranks to file name format
  ranks: {
    'A': 'ace',
    '2': 'two',
    '3': 'three',
    '4': 'four',
    '5': 'five',
    '6': 'six',
    '7': 'seven',
    '8': 'eight',
    '9': 'nine',
    '10': 'ten',
    'J': 'jack',
    'Q': 'queen',
    'K': 'king'
  },

  // Map suits to file name format
  suits: {
    'spades': 'Spade',
    'hearts': 'Heart',
    'clubs': 'Club',
    'diamonds': 'Diamond'
  },

  // Card back styles
  cardBackStyles: {
    classic: 'classicBack.png',
    red: 'redBack.png',
    blue: 'blueBack.png',
    green: 'greenBack.png',
    purple: 'purpleBack.png'
  }
};

// Chip image configuration
// Individual chip images named like: blueChipOne.png, redChipThree.png
export const CHIP_SPRITE_CONFIG = {
  chipWidth: 128,     // Width of each chip image in pixels
  chipHeight: 128,    // Height of each chip image in pixels

  // Base path for chip images
  basePath: '/assets/sprites/chips/',

  // Map arrangement names to file name suffixes
  arrangements: {
    singleChip: 'One',
    smallStack: 'Two',
    tallStack: 'Three',
    angledStack: 'Four',
    largeChip: 'Five',
    twoChips: 'Six',
    shortStack: 'Seven',
    scattered: 'Eight'
  },

  // Valid chip colors
  colors: ['black', 'red', 'blue', 'green', 'white']
};

// Character image configuration
// Individual character images named like: Character1.png, Character2.png
export const CHARACTER_CONFIG = {
  basePath: '/assets/sprites/',
  count: 8,

  // Character names (for display)
  names: [
    'Cool Cat',
    'Lucky Dog',
    'Wise Owl',
    'Sly Fox',
    'Happy Bear',
    'Swift Rabbit',
    'Brave Lion',
    'Clever Raccoon'
  ]
};

/**
 * Get the file path for a specific card using the new numbering system
 * Cards 1-13: Hearts (Ace-King)
 * Cards 14-15: Jokers (not used)
 * Cards 16-28: Diamonds (Ace-King)
 * Cards 29-41: Spades (Ace-King)
 * Cards 42-54: Clubs (Ace-King)
 * 
 * @param {string} suit - Card suit (spades, hearts, clubs, diamonds)
 * @param {string} rank - Card rank (A, 2-10, J, Q, K)
 * @returns {string} Full path to card image
 */
export function getCardImagePath(suit, rank) {
  // Map rank to position (0-12 for Ace through King)
  const rankMap = {
    'A': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6,
    '8': 7, '9': 8, '10': 9, 'J': 10, 'Q': 11, 'K': 12
  };

  // Map suit to base card number
  const suitBaseMap = {
    'hearts': 1,      // Cards 1-13
    'diamonds': 16,   // Cards 16-28
    'spades': 29,     // Cards 29-41
    'clubs': 42       // Cards 42-54
  };

  const rankIndex = rankMap[rank.toUpperCase()];
  const suitBase = suitBaseMap[suit.toLowerCase()];

  if (rankIndex === undefined || !suitBase) {
    console.warn(`Invalid card: ${rank} of ${suit}`);
    return null;
  }

  const cardNumber = suitBase + rankIndex;
  return `/assets/cards/card${cardNumber}.png`;
}

/**
 * Get the file path for a card back using the new numbering system
 * Card 55: Red back
 * Card 56: Green back
 * Card 57: Blue back
 * Card 58: Purple back
 * 
 * @param {string} style - Card back style (classic/red, green, blue, purple)
 * @returns {string} Full path to card back image
 */
export function getCardBackImagePath(style = 'classic') {
  // Map style to card number
  const styleMap = {
    'classic': 55,  // Red (default/classic)
    'red': 55,
    'green': 56,
    'blue': 57,
    'purple': 58
  };

  const cardNumber = styleMap[style.toLowerCase()] || 55;
  return `/assets/cards/card${cardNumber}.png`;
}

/**
 * Get the file path for a chip image using the new numbering system
 * Chips 1-4: Red (1, 2, 4, 7 chips)
 * Chips 5-8: Blue
 * Chips 9-12: White
 * Chips 13-16: Purple
 * Chips 17-20: Green
 * Chips 21-24: Pink
 * Chips 25-28: Black
 * Chips 29-32: Yellow
 * 
 * @param {string} color - Chip color (red, blue, white, purple, green, pink, black, yellow)
 * @param {number} stackSize - Stack size (1-4, where 1=smallest, 4=largest stack)
 * @returns {string} Full path to chip image
 */
export function getChipImagePath(color = 'red', stackSize = 1) {
  // Map color to base chip number
  const colorBaseMap = {
    'red': 1,      // Chips 1-4
    'blue': 5,     // Chips 5-8
    'white': 9,    // Chips 9-12
    'purple': 13,  // Chips 13-16
    'green': 17,   // Chips 17-20
    'pink': 21,    // Chips 21-24
    'black': 25,   // Chips 25-28
    'yellow': 29   // Chips 29-32
  };

  const colorBase = colorBaseMap[color.toLowerCase()];

  if (!colorBase) {
    console.warn(`Invalid chip color: ${color}, using red`);
    return `/assets/chips/chip1.png`;
  }

  // Ensure stackSize is between 1 and 4
  const size = Math.max(1, Math.min(4, stackSize));

  const chipNumber = colorBase + (size - 1);
  return `/assets/chips/chip${chipNumber}.png`;
}

/**
 * Get the file path for a character image
 * @param {number} characterId - Character ID (0-7)
 * @returns {string} Full path to character image
 */
export function getCharacterImagePath(characterId) {
  const config = CHARACTER_CONFIG;

  if (characterId < 0 || characterId >= config.count) {
    console.warn(`Invalid character ID: ${characterId}`);
    characterId = 0;
  }

  // Convert 0-based ID to 1-based number for filename (0 -> 1, 1 -> 2, etc.)
  const characterNumber = characterId + 1;

  // Format: Character1.png, Character2.png, etc.
  return `${config.basePath}Character${characterNumber}.png`;
}

/**
 * Get character name by ID
 * @param {number} characterId - Character ID (0-7)
 * @returns {string} Character display name
 */
export function getCharacterName(characterId) {
  const config = CHARACTER_CONFIG;

  if (characterId < 0 || characterId >= config.count) {
    return config.names[0];
  }

  return config.names[characterId];
}
