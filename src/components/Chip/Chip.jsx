import React, { useState } from 'react';
import { getChipSpriteInfo, CHIP_SPRITE_CONFIG } from '../../utils/spriteConfig';
import './Chip.css';

/**
 * Poker Chip Component
 * Displays a poker chip using sprite sheet with fallback rendering
 *
 * @param {string} color - Chip color (black, red, blue, green, white)
 * @param {string} arrangement - Chip arrangement (singleChip, smallStack, etc.)
 * @param {number} count - Number of chips (optional, for display)
 * @param {number} scale - Scale multiplier (optional, defaults to 1)
 */
const Chip = ({ color = 'black', arrangement = 'singleChip', count, scale = 1 }) => {
  const [useSprite, setUseSprite] = useState(true);
  const chipInfo = getChipSpriteInfo(color, arrangement);
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

  // Try to use sprite sheet
  const chipStyle = {
    width: `${config.chipWidth * scale}px`,
    height: `${config.chipHeight * scale}px`,
    backgroundImage: `url(${chipInfo.path})`,
    backgroundPosition: `-${chipInfo.x * scale}px -${chipInfo.y * scale}px`,
    backgroundSize: `${config.chipWidth * config.columns * scale}px ${config.chipHeight * config.rows * scale}px`
  };

  return (
    <div className="chip-container">
      <img
        src={chipInfo.path}
        alt=""
        style={{ display: 'none' }}
        onError={() => setUseSprite(false)}
      />
      <div className="chip-sprite" style={chipStyle}></div>
      {count && count > 1 && (
        <div className="chip-count">{count}</div>
      )}
    </div>
  );
};

export default Chip;
