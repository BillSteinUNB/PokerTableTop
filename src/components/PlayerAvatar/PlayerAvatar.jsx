import React from 'react';
import { AVATAR_SPRITE_CONFIG } from '../../data/gameData';
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
  const config = AVATAR_SPRITE_CONFIG;

  const avatarStyle = {
    width: `${config.avatarWidth * scale}px`,
    height: `${config.avatarHeight * scale}px`,
    backgroundImage: `url(${config.spriteSheetPath})`,
    backgroundPosition: `-${avatarId * config.avatarWidth * scale}px 0`,
    backgroundSize: `${config.avatarWidth * config.columns * scale}px ${config.avatarHeight * scale}px`
  };

  // Emoji fallback while sprite sheet doesn't exist
  const emojiAvatars = ['😎', '🤖', '🤠', '🏴‍☠️', '🥷', '🧙', '⚔️', '👽'];

  return (
    <div className="player-avatar-container">
      <div className="avatar-sprite" style={avatarStyle}>
        {/* Emoji fallback */}
        <span className="avatar-emoji-fallback">{emojiAvatars[avatarId]}</span>
      </div>
      {showName && name && (
        <div className="avatar-name">{name}</div>
      )}
    </div>
  );
};

export default PlayerAvatar;
