// Character avatars data
// Each character has a face image for selection
export const CHARACTERS = [
  { id: 0, name: 'Cool Cat', imagePath: '/assets/sprites/characters/cat.png', emoji: '😎' },
  { id: 1, name: 'Robot', imagePath: '/assets/sprites/characters/robot.png', emoji: '🤖' },
  { id: 2, name: 'Cowboy', imagePath: '/assets/sprites/characters/cowboy.png', emoji: '🤠' },
  { id: 3, name: 'Pirate', imagePath: '/assets/sprites/characters/pirate.png', emoji: '🏴‍☠️' },
  { id: 4, name: 'Ninja', imagePath: '/assets/sprites/characters/ninja.png', emoji: '🥷' },
  { id: 5, name: 'Wizard', imagePath: '/assets/sprites/characters/wizard.png', emoji: '🧙' },
  { id: 6, name: 'Knight', imagePath: '/assets/sprites/characters/knight.png', emoji: '⚔️' },
  { id: 7, name: 'Alien', imagePath: '/assets/sprites/characters/alien.png', emoji: '👽' }
];

// Card color options - using card back styles from sprite sheet
export const CARD_COLORS = [
  { id: 'classic', name: 'Classic' },
  { id: 'red', name: 'Red' },
  { id: 'blue', name: 'Blue' },
  { id: 'green', name: 'Green' },
  { id: 'purple', name: 'Purple' }
];

// Chip type options - corresponding to chip color files
export const CHIP_TYPES = [
  { id: 'black', name: 'Black', color: 'black' },
  { id: 'red', name: 'Red', color: 'red' },
  { id: 'blue', name: 'Blue', color: 'blue' },
  { id: 'green', name: 'Green', color: 'green' },
  { id: 'white', name: 'White', color: 'white' }
];

// Avatar sprite configuration
export const AVATAR_SPRITE_CONFIG = {
  spriteSheetPath: '/assets/sprites/avatars.png',
  avatarWidth: 48,
  avatarHeight: 48,
  columns: 8,
  rows: 1
};
