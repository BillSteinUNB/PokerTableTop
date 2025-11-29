import React, { useState } from 'react';
import { getCharacterImagePath } from '../../utils/spriteConfig';
import './PlayerAvatar.css';

/**
 * Player Avatar Component
 * Displays player's pixel art avatar with name
 *
 * @param {number} avatarId - Avatar sprite index (0-7)
 * @param {string} name - Player name
 * @param {number} scale - Scale multiplier
 * @param {boolean} showName - Whether to display name below avatar
 */
const PlayerAvatar = ({ avatarId = 0, name, scale = 1, showName = true }) => {
  const [useSprite, setUseSprite] = useState(true);

  // Emoji fallback
  const emojiAvatars = ['😎', '🤖', '🤠', '🏴‍☠️', '🥷', '🧙', '⚔️', '👽'];

  // Try to use character image
  const imagePath = getCharacterImagePath(avatarId);

  if (!useSprite || !imagePath) {
    // Fallback to emoji
    return (
      <div className="player-avatar-container">
        <div
          className="avatar-emoji-fallback"
          style={{
            fontSize: `${48 * scale}px`,
            width: `${64 * scale}px`,
            height: `${64 * scale}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {emojiAvatars[avatarId] || '😎'}
        </div>
        {showName && name && (
          <div className="avatar-name">{name}</div>
        )}
      </div>
    );
  }

  return (
    <div className="player-avatar-container">
      {showName && name && (
        <div className="avatar-name">{name}</div>
      )}
      <img
        src={imagePath}
        alt={name || `Avatar ${avatarId}`}
        className="avatar-sprite"
        style={{
          width: 'auto',
          height: `${64 * scale}px`,
          imageRendering: 'pixelated',
          display: 'block'
        }}
        onError={() => setUseSprite(false)}
      />
    </div>
  );
};

export default PlayerAvatar;
