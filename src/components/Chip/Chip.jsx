import React, { useState } from 'react';
import { getChipImagePath, CHIP_SPRITE_CONFIG } from '../../utils/spriteConfig';
import './Chip.css';

/**
 * Poker Chip Component
 * Displays a poker chip using individual image files with fallback rendering
 *
 * @param {string} color - Chip color (black, red, blue, green, white)
 * @param {string} arrangement - Chip arrangement (singleChip, smallStack, etc.)
 * @param {number} count - Number of chips (optional, for display)
 * @param {number} scale - Scale multiplier (optional, defaults to 1)
 */
const Chip = ({ color = 'black', arrangement = 'singleChip', count, scale = 1 }) => {
  const [useSprite, setUseSprite] = useState(true);
  const config = CHIP_SPRITE_CONFIG;

  // Fallback chip colors
  const chipColors = {
    black: '#1a1a1a',
    red: '#dc2626',
    blue: '#2563eb',
    green: '#16a34a',
    white: '#f5f5f5'
  };

  const chipBorders = {
    black: '#fff',
    red: '#fff',
    blue: '#fff',
    green: '#fff',
    white: '#1a1a1a'
  };

  // If sprite fails, use CSS fallback
  if (!useSprite) {
    return (
      <div className="chip-container">
        <div
          className="chip-sprite fallback"
          style={{
            width: `${config.chipWidth * scale}px`,
            height: `${config.chipHeight * scale}px`,
            background: chipColors[color],
            border: `${4 * scale}px solid ${chipBorders[color]}`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${16 * scale}px`,
            fontWeight: 'bold',
            color: chipBorders[color],
            boxShadow: `0 ${4 * scale}px 0 rgba(0,0,0,0.3), inset 0 ${2 * scale}px ${4 * scale}px rgba(255,255,255,0.2)`
          }}
        >
          ●
        </div>
        {count && count > 1 && (
          <div className="chip-count">{count}</div>
        )}
      </div>
    );
  }

  // Get the image path for this chip
  const imagePath = getChipImagePath(color, arrangement);

  // If we couldn't get a valid path, use fallback
  if (!imagePath) {
    setUseSprite(false);
    return null; // Will re-render with fallback
  }

  return (
    <div className="chip-container">
      <img
        src={imagePath}
        alt={`${color} chip ${arrangement}`}
        className="chip-sprite"
        style={{
          width: `${config.chipWidth * scale}px`,
          height: `${config.chipHeight * scale}px`,
          imageRendering: 'pixelated',
          display: 'block'
        }}
        onError={() => setUseSprite(false)}
      />
      {count && count > 1 && (
        <div className="chip-count">{count}</div>
      )}
    </div>
  );
};

export default Chip;
