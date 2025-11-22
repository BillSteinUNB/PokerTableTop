// Character avatars data
// These reference sprite positions for 8 different pixel art characters
export const CHARACTERS = [
  { id: 0, name: 'Cool Cat', spriteIndex: 0 },
  { id: 1, name: 'Robot', spriteIndex: 1 },
  { id: 2, name: 'Cowboy', spriteIndex: 2 },
  { id: 3, name: 'Pirate', spriteIndex: 3 },
  { id: 4, name: 'Ninja', spriteIndex: 4 },
  { id: 5, name: 'Wizard', spriteIndex: 5 },
  { id: 6, name: 'Knight', spriteIndex: 6 },
  { id: 7, name: 'Alien', spriteIndex: 7 }
];

// Card color options
export const CARD_COLORS = [
  { id: 'classic', name: 'Classic', color: '#FFFFFF' },
  { id: 'red', name: 'Red', color: '#FF4444' },
  { id: 'blue', name: 'Blue', color: '#4444FF' },
  { id: 'green', name: 'Green', color: '#44FF44' },
  { id: 'purple', name: 'Purple', color: '#AA44FF' }
];

// Chip type options
export const CHIP_TYPES = [
  { id: 'classic', name: 'Classic' },
  { id: 'casino', name: 'Casino' },
  { id: 'neon', name: 'Neon' }
];

// Avatar sprite configuration
export const AVATAR_SPRITE_CONFIG = {
  spriteSheetPath: '/assets/sprites/avatars.png',
  avatarWidth: 48,
  avatarHeight: 48,
  columns: 8,
  rows: 1
};
