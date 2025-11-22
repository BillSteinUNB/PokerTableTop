import React from 'react';
import { CHIP_SPRITE_CONFIG, getChipSpritePosition } from '../../utils/spriteConfig';
import './Chip.css';

/**
 * Poker Chip Component
 * Displays a poker chip using sprite sheet
 *
 * @param {number} value - Chip denomination (1, 5, 10, 25, 100)
 * @param {number} count - Number of chips (optional, for display)
 * @param {number} scale - Scale multiplier (optional, defaults to 1)
 */
const Chip = ({ value = 1, count, scale = 1 }) => {
  const position = getChipSpritePosition(value);
  const config = CHIP_SPRITE_CONFIG;

  const chipStyle = {
    width: `${config.chipWidth * scale}px`,
    height: `${config.chipHeight * scale}px`,
    backgroundImage: `url(${config.spriteSheetPath})`,
    backgroundPosition: `-${position.x * scale}px -${position.y * scale}px`,
    backgroundSize: `${config.chipWidth * config.columns * scale}px ${config.chipHeight * config.rows * scale}px`
  };

  return (
    <div className="chip-container">
      <div className="chip-sprite" style={chipStyle}></div>
      {count && count > 1 && (
        <div className="chip-count">{count}</div>
      )}
    </div>
  );
};

export default Chip;
