import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { CHARACTERS, CARD_COLORS, CHIP_TYPES } from '../../data/gameData';
import './CharacterSelection.css';

/**
 * Character Selection Component
 * Customize player name, avatar, card color, and chip type
 */
const CharacterSelection = () => {
  const { playerData, updatePlayerData, navigateTo, createLobby, lobbyData } = useGame();
  const [name, setName] = useState(playerData.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(playerData.avatar || 0);
  const [selectedCardColor, setSelectedCardColor] = useState(playerData.cardColor || 'classic');
  const [selectedChipType, setSelectedChipType] = useState(playerData.chipType || 'classic');
  const [nameError, setNameError] = useState('');

  const handleNameChange = (e) => {
    const value = e.target.value.slice(0, 12);
    setName(value);
    setNameError('');
  };

  const handleContinue = () => {
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }

    // Update player data
    updatePlayerData({
      name: name.trim(),
      avatar: selectedAvatar,
      cardColor: selectedCardColor,
      chipType: selectedChipType
    });

    // Navigate to lobby
    navigateTo('lobby');
  };

  const handleBack = () => {
    navigateTo('mainMenu');
  };

  return (
    <div className="character-selection">
      <div className="selection-container">
        <div className="selection-header">
          <h2 className="selection-title">CUSTOMIZE PLAYER</h2>
          <p className="selection-subtitle">Choose your style</p>
        </div>

        <div className="selection-content">
          {/* Name Input */}
          <div className="selection-section">
            <label className="section-label">NAME</label>
            <input
              type="text"
              className="name-input"
              value={name}
              onChange={handleNameChange}
              placeholder="Enter name..."
              maxLength={12}
              autoFocus
            />
            {nameError && <div className="error-message">{nameError}</div>}
            <div className="char-count">{name.length}/12</div>
          </div>

          {/* Avatar Selection */}
          <div className="selection-section">
            <label className="section-label">CHARACTER</label>
            <div className="avatar-grid">
              {CHARACTERS.map((char) => (
                <div
                  key={char.id}
                  className={`avatar-option ${selectedAvatar === char.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(char.id)}
                >
                  <div className="avatar-placeholder">
                    {/* Sprite would go here */}
                    <span className="avatar-emoji">
                      {['😎', '🤖', '🤠', '🏴‍☠️', '🥷', '🧙', '⚔️', '👽'][char.id]}
                    </span>
                  </div>
                  <div className="avatar-name">{char.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Color Selection */}
          <div className="selection-section">
            <label className="section-label">CARD COLOR</label>
            <div className="color-grid">
              {CARD_COLORS.map((color) => (
                <div
                  key={color.id}
                  className={`color-option ${selectedCardColor === color.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCardColor(color.id)}
                >
                  <div
                    className="color-swatch"
                    style={{ background: color.color }}
                  ></div>
                  <div className="color-name">{color.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chip Type Selection */}
          <div className="selection-section">
            <label className="section-label">CHIP STYLE</label>
            <div className="chip-grid">
              {CHIP_TYPES.map((chip) => (
                <div
                  key={chip.id}
                  className={`chip-option ${selectedChipType === chip.id ? 'selected' : ''}`}
                  onClick={() => setSelectedChipType(chip.id)}
                >
                  <div className="chip-preview">
                    <div className="chip-icon">●</div>
                  </div>
                  <div className="chip-name">{chip.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="selection-buttons">
          <button className="selection-btn btn-back" onClick={handleBack}>
            ← BACK
          </button>
          <button
            className="selection-btn btn-continue"
            onClick={handleContinue}
            disabled={name.trim().length < 2}
          >
            CONTINUE →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelection;
