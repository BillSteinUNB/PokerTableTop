import React from 'react';
import { CARD_SPRITE_CONFIG, getCardSpritePosition } from '../../utils/spriteConfig';
import './Card.css';

/**
 * Playing Card Component
 * Displays a playing card using sprite sheet
 *
 * @param {string} suit - Card suit (hearts, diamonds, clubs, spades)
 * @param {string} rank - Card rank (A, 2-10, J, Q, K)
 * @param {boolean} faceDown - Whether to show card back (default: false)
 * @param {number} scale - Scale multiplier (optional, defaults to 1)
 * @param {Function} onClick - Click handler (optional)
 */
const Card = ({ suit, rank, faceDown = false, scale = 1, onClick }) => {
  const config = CARD_SPRITE_CONFIG;

  let cardStyle;

  if (faceDown) {
    // Card back - you can use a different sprite or solid color
    cardStyle = {
      width: `${config.cardWidth * scale}px`,
      height: `${config.cardHeight * scale}px`,
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      border: '2px solid #1e40af',
    };
  } else {
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
    >
      {faceDown && (
        <div className="card-back-pattern">
          <div className="card-back-logo">♠♥♣♦</div>
        </div>
      )}
    </div>
  );
};

export default Card;
