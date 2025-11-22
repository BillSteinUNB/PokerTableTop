import { getCharacterImagePath, getCharacterName } from '../utils/spriteConfig';

// Character avatars data
// Each character has a face image for selection
// Using naming convention: characterOne.png, characterTwo.png, etc.
export const CHARACTERS = [
  { id: 0, name: getCharacterName(0), imagePath: getCharacterImagePath(0), emoji: '😎' },
  { id: 1, name: getCharacterName(1), imagePath: getCharacterImagePath(1), emoji: '🤖' },
  { id: 2, name: getCharacterName(2), imagePath: getCharacterImagePath(2), emoji: '🤠' },
  { id: 3, name: getCharacterName(3), imagePath: getCharacterImagePath(3), emoji: '🏴‍☠️' },
  { id: 4, name: getCharacterName(4), imagePath: getCharacterImagePath(4), emoji: '🥷' },
  { id: 5, name: getCharacterName(5), imagePath: getCharacterImagePath(5), emoji: '🧙' },
  { id: 6, name: getCharacterName(6), imagePath: getCharacterImagePath(6), emoji: '⚔️' },
  { id: 7, name: getCharacterName(7), imagePath: getCharacterImagePath(7), emoji: '👽' }
];

// Card color options - using card back styles
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
