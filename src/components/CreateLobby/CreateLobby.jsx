import React from 'react';
import { useGame } from '../../context/GameContext';
import './CreateLobby.css';

/**
 * Create Lobby Component
 * Screen for creating a new game lobby (goes to character select first)
 */
const CreateLobby = () => {
  const { navigateTo } = useGame();

  const handleContinue = () => {
    // Go to character selection first, then create lobby
    navigateTo('characterSelect');
  };

  const handleBack = () => {
    navigateTo('mainMenu');
  };

  return (
    <div className="create-lobby">
      <div className="create-container">
        <div className="create-header">
          <h2 className="create-title">CREATE LOBBY</h2>
          <p className="create-subtitle">Set up your poker game</p>
        </div>

        <div className="create-info">
          <div className="info-box">
            <div className="info-icon">👤</div>
            <div className="info-text">
              <div className="info-label">Max Players</div>
              <div className="info-value">2 - 8 Players</div>
            </div>
          </div>

          <div className="info-box">
            <div className="info-icon">💰</div>
            <div className="info-text">
              <div className="info-label">Starting Chips</div>
              <div className="info-value">1000 Chips</div>
            </div>
          </div>

          <div className="info-box">
            <div className="info-icon">🎲</div>
            <div className="info-text">
              <div className="info-label">Game Mode</div>
              <div className="info-value">Texas Hold'em</div>
            </div>
          </div>

          <div className="settings-note">
            <p>⚙️ More settings available in lobby</p>
          </div>
        </div>

        <div className="create-buttons">
          <button className="create-btn btn-back" onClick={handleBack}>
            ← BACK
          </button>
          <button className="create-btn btn-continue" onClick={handleContinue}>
            CONTINUE →
          </button>
        </div>

        <div className="create-hint">
          <p>You'll customize your character next</p>
        </div>
      </div>
    </div>
  );
};

export default CreateLobby;
