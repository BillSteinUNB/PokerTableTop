import React, { useState } from 'react';
import { useGame } from '../../context/GameContextMultiplayer';
import { CHARACTERS, CARD_COLORS, CHIP_TYPES } from '../../data/gameData';
import Card from '../Card/Card';
import Chip from '../Chip/Chip';
import './CharacterSelection.css';

/**
 * Character Selection Component
 * Customize player name, avatar, card color, and chip type
 */
const CharacterSelection = () => {
  const { playerData, updatePlayerData, navigateTo, createLobby, joinLobby } = useGame();
  const [name, setName] = useState(playerData.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(playerData.avatar || 0);
  const [selectedCardColor, setSelectedCardColor] = useState(playerData.cardColor || 'classic');
  const [selectedChipType, setSelectedChipType] = useState(playerData.chipType || 'black');
  const [nameError, setNameError] = useState('');

  // Check if we're joining an existing lobby
  const pendingLobbyCode = sessionStorage.getItem('pendingLobbyCode');
  const isJoining = !!pendingLobbyCode;

  const handleNameChange = (e) => {
    const value = e.target.value.slice(0, 12);
    setName(value);
    setNameError('');
  };

  const handleContinue = async () => {
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }

    // Prepare player data
    const newPlayerData = {
      name: name.trim(),
      avatar: selectedAvatar,
      cardColor: selectedCardColor,
      chipType: selectedChipType
    };

    // Update player data in context
    updatePlayerData(newPlayerData);

    try {
      // Check if we're joining an existing lobby
      const pendingLobbyCode = sessionStorage.getItem('pendingLobbyCode');
      console.log('[CharacterSelection] Checking for pending lobby code:', pendingLobbyCode);

      if (pendingLobbyCode) {
        // Join existing lobby
        console.log('[CharacterSelection] Joining lobby:', pendingLobbyCode, 'with player:', newPlayerData);
        await joinLobby(pendingLobbyCode, true, newPlayerData); // true = multiplayer mode
        // Only remove the code after successful join
        sessionStorage.removeItem('pendingLobbyCode');
        navigateTo('lobby');
      } else {
        // Create new lobby
        console.log('[CharacterSelection] No pending code found, creating new lobby with player:', newPlayerData);
        await createLobby(true, newPlayerData); // true = multiplayer mode
        navigateTo('lobby');
      }
    } catch (error) {
      console.error('[CharacterSelection] Error:', error);
      const errorMsg = error.message || 'Unknown error';

      // Provide user-friendly error messages
      if (errorMsg.includes('already taken')) {
        setNameError('⚠️ This name is already taken. Please choose a different name.');
      } else if (errorMsg.includes('full')) {
        setNameError('⚠️ This lobby is full. Cannot join.');
      } else if (errorMsg.includes('not found')) {
        setNameError('⚠️ Lobby not found. Please check the code.');
      } else {
        setNameError(`⚠️ ${errorMsg}`);
      }
      // Don't remove pendingLobbyCode on error - let user try again with different name
    }
  };

  const handleOfflinePlay = async () => {
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }

    const newPlayerData = {
      name: name.trim(),
      avatar: selectedAvatar,
      cardColor: selectedCardColor,
      chipType: selectedChipType
    };

    updatePlayerData(newPlayerData);

    // Create local lobby (which adds bot)
    createLobby(false, newPlayerData);
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
                    {/* Character face image with emoji fallback */}
                    <img
                      src={char.imagePath}
                      alt={char.name}
                      className="avatar-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <span className="avatar-emoji" style={{ display: 'none' }}>
                      {char.emoji}
                    </span>
                  </div>
                  <div className="avatar-name">{char.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Card Color Selection - Using Card Backs */}
          <div className="selection-section">
            <label className="section-label">CARD BACK</label>
            <div className="color-grid">
              {CARD_COLORS.map((color) => (
                <div
                  key={color.id}
                  className={`color-option ${selectedCardColor === color.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCardColor(color.id)}
                >
                  <div className="card-back-preview">
                    <Card faceDown cardBackStyle={color.id} scale={0.3} />
                  </div>
                  <div className="color-name">{color.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chip Type Selection */}
          <div className="selection-section">
            <label className="section-label">CHIP COLOR</label>
            <div className="chip-grid">
              {CHIP_TYPES.map((chip) => (
                <div
                  key={chip.id}
                  className={`chip-option ${selectedChipType === chip.id ? 'selected' : ''}`}
                  onClick={() => setSelectedChipType(chip.id)}
                >
                  <div className="chip-preview">
                    <Chip color={chip.color} arrangement="singleChip" scale={0.5} />
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

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="selection-btn"
              onClick={handleOfflinePlay}
              disabled={name.trim().length < 2}
              style={{
                background: '#4a90e2',
                borderColor: '#2e5c8a',
                color: '#fff',
                flex: 1
              }}
            >
              PLAY OFFLINE
            </button>

            <button
              className="selection-btn btn-continue"
              onClick={handleContinue}
              disabled={name.trim().length < 2}
              style={{ flex: 1 }}
            >
              {isJoining ? 'JOIN PARTY →' : 'CREATE PARTY →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelection;
