import React, { useState } from 'react';
import { CARD_SPRITE_CONFIG, getCardSpritePosition, getCardBackSpritePosition } from '../../utils/spriteConfig';
import './Card.css';

/**
 * Playing Card Component
 * Displays a playing card using sprite sheet with fallback rendering
 *
 * @param {string} suit - Card suit (spades, hearts, clubs, diamonds)
 * @param {string} rank - Card rank (A, 2-10, J, Q, K)
 * @param {boolean} faceDown - Whether to show card back (default: false)
 * @param {string} cardBackStyle - Card back style (classic, red, blue, green, purple)
 * @param {number} scale - Scale multiplier (optional, defaults to 1)
 * @param {Function} onClick - Click handler (optional)
 */
const Card = ({ suit, rank, faceDown = false, cardBackStyle = 'classic', scale = 1, onClick }) => {
  const [useSprite, setUseSprite] = useState(true);
  const config = CARD_SPRITE_CONFIG;

  // Suit colors and symbols
  const suitColors = {
    hearts: '#ff0000',
    diamonds: '#ff0000',
    clubs: '#000000',
    spades: '#000000'
  };

  const suitSymbols = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };

  const cardBackColors = {
    classic: '#1e3a8a',
    red: '#991b1b',
    blue: '#1e40af',
    green: '#166534',
    purple: '#6b21a8'
  };

  // If sprite fails to load, use CSS fallback
  if (!useSprite) {
    if (faceDown) {
      // CSS card back fallback
      return (
        <div
          className={`card-sprite face-down fallback ${onClick ? 'clickable' : ''}`}
          style={{
            width: `${config.cardWidth * scale}px`,
            height: `${config.cardHeight * scale}px`,
            background: `linear-gradient(135deg, ${cardBackColors[cardBackStyle]} 0%, ${cardBackColors[cardBackStyle]}dd 100%)`,
            border: '3px solid #000',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${20 * scale}px`,
            color: 'rgba(255,255,255,0.3)',
            fontWeight: 'bold'
          }}
          onClick={onClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
        >
          ♠♥♣♦
        </div>
      );
    } else {
      // CSS card face fallback
      const suitColor = suitColors[suit?.toLowerCase()] || '#000';
      const suitSymbol = suitSymbols[suit?.toLowerCase()] || '?';

      return (
        <div
          className={`card-sprite face-up fallback ${onClick ? 'clickable' : ''}`}
          style={{
            width: `${config.cardWidth * scale}px`,
            height: `${config.cardHeight * scale}px`,
            background: '#fff',
            border: '3px solid #000',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${8 * scale}px`,
            color: suitColor,
            fontSize: `${24 * scale}px`,
            fontWeight: 'bold'
          }}
          onClick={onClick}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
        >
          <div style={{ display: 'flex', gap: '4px' }}>
            <span>{rank}</span>
            <span>{suitSymbol}</span>
          </div>
          <div style={{ fontSize: `${48 * scale}px` }}>{suitSymbol}</div>
          <div style={{ display: 'flex', gap: '4px', transform: 'rotate(180deg)' }}>
            <span>{rank}</span>
            <span>{suitSymbol}</span>
          </div>
        </div>
      );
    }
  }

  // Try to use sprite sheet
  let cardStyle;

  if (faceDown) {
    const backPosition = getCardBackSpritePosition(cardBackStyle);
    cardStyle = {
      width: `${config.cardWidth * scale}px`,
      height: `${config.cardHeight * scale}px`,
      backgroundImage: `url(${config.spriteSheetPath})`,
      backgroundPosition: `-${backPosition.x * scale}px -${backPosition.y * scale}px`,
      backgroundSize: `${config.cardWidth * config.columns * scale}px ${config.cardHeight * config.rows * scale}px`
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
    <>
      <img
        src={config.spriteSheetPath}
        alt=""
        style={{ display: 'none' }}
        onError={() => setUseSprite(false)}
      />
      <div
        className={`card-sprite ${faceDown ? 'face-down' : 'face-up'} ${onClick ? 'clickable' : ''}`}
        style={cardStyle}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      />
    </>
  );
};

export default Card;
