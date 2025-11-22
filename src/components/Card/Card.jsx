import React from 'react';
import { CARD_SPRITE_CONFIG, getCardSpritePosition, getCardBackSpritePosition } from '../../utils/spriteConfig';
import './Card.css';

/**
 * Playing Card Component
 * Displays a playing card using sprite sheet
 *
 * @param {string} suit - Card suit (spades, hearts, clubs, diamonds)
 * @param {string} rank - Card rank (A, 2-10, J, Q, K)
 * @param {boolean} faceDown - Whether to show card back (default: false)
 * @param {string} cardBackStyle - Card back style (classic, red, blue, green, purple)
 * @param {number} scale - Scale multiplier (optional, defaults to 1)
 * @param {Function} onClick - Click handler (optional)
 */
const Card = ({ suit, rank, faceDown = false, cardBackStyle = 'classic', scale = 1, onClick }) => {
  const config = CARD_SPRITE_CONFIG;

  let cardStyle;

  if (faceDown) {
    // Use card back sprite from sprite sheet
    const backPosition = getCardBackSpritePosition(cardBackStyle);

    cardStyle = {
      width: `${config.cardWidth * scale}px`,
      height: `${config.cardHeight * scale}px`,
      backgroundImage: `url(${config.spriteSheetPath})`,
      backgroundPosition: `-${backPosition.x * scale}px -${backPosition.y * scale}px`,
      backgroundSize: `${config.cardWidth * config.columns * scale}px ${config.cardHeight * config.rows * scale}px`
    };
  } else {
    // Use card face sprite
    const position = getCardSpritePosition(suit, rank);

    cardStyle = {
      width: `${config.cardWidth * scale}px`,
      height: `${config.cardHeight * scale}px`,
      backgroundImage: `url(${config.spriteSheetPath})`,
      backgroundPosition: `-${position.x * scale}px -${position.y * scale}px`,
      backgroundSize: `${config.cardWidth * config.columns * scale}px ${config.cardHeight * config.rows * scale}px`
    };
  }

  return (
    <div
      className={`card-sprite ${faceDown ? 'face-down' : 'face-up'} ${onClick ? 'clickable' : ''}`}
      style={cardStyle}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    />
  );
};

export default Card;
