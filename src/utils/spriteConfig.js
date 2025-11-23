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
// Individual character images named like: characterOne.png, characterTwo.png
export const CHARACTER_CONFIG = {
  basePath: '/assets/sprites/characters/',
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
 * Get the file path for a specific card
 * @param {string} suit - Card suit (spades, hearts, clubs, diamonds)
 * @param {string} rank - Card rank (A, 2-10, J, Q, K)
 * @returns {string} Full path to card image
 */
export function getCardImagePath(suit, rank) {
  const config = CARD_SPRITE_CONFIG;
  const rankName = config.ranks[rank.toUpperCase()];
  const suitName = config.suits[suit.toLowerCase()];

  if (!rankName || !suitName) {
    console.warn(`Invalid card: ${rank} of ${suit}`);
    return null;
  }

  // Format: aceSpade.png, twoHeart.png, kingDiamond.png
  return `${config.basePath}${rankName}${suitName}.png`;
}

/**
 * Get the file path for a card back
 * @param {string} style - Card back style (classic, red, blue, green, purple)
 * @returns {string} Full path to card back image
 */
export function getCardBackImagePath(style = 'classic') {
  const config = CARD_SPRITE_CONFIG;
  const fileName = config.cardBackStyles[style.toLowerCase()];

  if (!fileName) {
    console.warn(`Invalid card back style: ${style}`);
    return `${config.cardBackPath}${config.cardBackStyles.classic}`;
  }

  return `${config.cardBackPath}${fileName}`;
}

/**
 * Get the file path for a chip image
 * @param {string} color - Chip color (black, red, blue, green, white)
 * @param {string} arrangement - Chip arrangement type (singleChip, smallStack, etc.)
 * @returns {string} Full path to chip image
 */
export function getChipImagePath(color = 'black', arrangement = 'singleChip') {
  const config = CHIP_SPRITE_CONFIG;
  const arrangementSuffix = config.arrangements[arrangement];

  if (!arrangementSuffix) {
    console.warn(`Invalid chip arrangement: ${arrangement}`);
    return null;
  }

  if (!config.colors.includes(color.toLowerCase())) {
    console.warn(`Invalid chip color: ${color}`);
    color = 'black';
  }

  // Capitalize first letter of color
  const colorCapitalized = color.charAt(0).toUpperCase() + color.slice(1).toLowerCase();

  // Format: blueChipOne.png, redChipThree.png
  return `${config.basePath}${color.toLowerCase()}Chip${arrangementSuffix}.png`;
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

  // Convert number to word (0 -> One, 1 -> Two, etc.)
  const numbers = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

  // Format: characterOne.png, characterTwo.png
  return `${config.basePath}character${numbers[characterId]}.png`;
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
