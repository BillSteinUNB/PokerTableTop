import React, { useState } from 'react';
import { useGame } from '../../context/GameContextMultiplayer';
import { initializeGame, startNewHand } from '../../utils/gameEngine';
import './CreateLobby.css';

/**
 * Create Lobby Component
 * Screen for creating a new game lobby (goes to character select first)
 */
const CreateLobby = () => {
  const { navigateTo, updatePlayerData, createLobby, lobbyData, setGameState, updateGameSettings } = useGame();

  // Game settings state
  const [settings, setSettings] = useState({
    startingChips: 1000,
    smallBlind: 5,
    bigBlind: 10,
    minPlayers: 2,
    maxPlayers: 8
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: parseInt(value) || 0
    }));
  };

  const handleContinue = () => {
    // Store settings for when lobby is created
    updateGameSettings(settings);
    // Go to character selection first, then create lobby
    navigateTo('characterSelect');
  };

  const handleBack = () => {
    navigateTo('mainMenu');
  };

  const handleDemo = () => {
    // Create demo player
    const demoPlayer = {
      name: 'You',
      avatar: 0,
      cardColor: 'classic',
      chipType: 'black'
    };

    updatePlayerData(demoPlayer);

    // Create 3 fake players for demo
    const allPlayers = [
      demoPlayer,
      { name: 'Alice', avatar: 1, cardColor: 'red', chipType: 'red' },
      { name: 'Bob', avatar: 2, cardColor: 'blue', chipType: 'blue' },
      { name: 'Charlie', avatar: 3, cardColor: 'green', chipType: 'green' }
    ];

    // Use the current settings from state
    const initialGameState = initializeGame(allPlayers, settings);
    const gameWithCards = startNewHand(initialGameState);

    setGameState(gameWithCards);

    // Go directly to game view
    navigateTo('game');
  };

  return (
    <div className="create-lobby">
      <div className="create-container">
        <div className="create-header">
          <h2 className="create-title">CREATE LOBBY</h2>
          <p className="create-subtitle">Set up your poker game</p>
        </div>

        <div className="create-info">
          <div className="settings-grid">
            <div className="setting-control">
              <label className="setting-label">
                <span className="setting-icon">💰</span>
                Starting Chips
              </label>
              <input
                type="number"
                className="setting-input"
                value={settings.startingChips}
                onChange={(e) => handleSettingChange('startingChips', e.target.value)}
                min="100"
                max="100000"
                step="100"
              />
            </div>

            <div className="setting-control">
              <label className="setting-label">
                <span className="setting-icon">🔽</span>
                Small Blind
              </label>
              <input
                type="number"
                className="setting-input"
                value={settings.smallBlind}
                onChange={(e) => handleSettingChange('smallBlind', e.target.value)}
                min="1"
                max="1000"
                step="1"
              />
            </div>

            <div className="setting-control">
              <label className="setting-label">
                <span className="setting-icon">🔼</span>
                Big Blind
              </label>
              <input
                type="number"
                className="setting-input"
                value={settings.bigBlind}
                onChange={(e) => handleSettingChange('bigBlind', e.target.value)}
                min="2"
                max="2000"
                step="1"
              />
            </div>

            <div className="setting-control">
              <label className="setting-label">
                <span className="setting-icon">👤</span>
                Max Players
              </label>
              <input
                type="number"
                className="setting-input"
                value={settings.maxPlayers}
                onChange={(e) => handleSettingChange('maxPlayers', e.target.value)}
                min="2"
                max="8"
                step="1"
              />
            </div>
          </div>

          <div className="settings-note">
            <p>⚙️ You can adjust these settings in the lobby</p>
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

        {/* Demo Mode Button */}
        <div className="demo-section">
          <div className="demo-divider">
            <span>OR</span>
          </div>
          <button className="demo-btn" onClick={handleDemo}>
            🎮 DEMO MODE
          </button>
          <p className="demo-hint">Test the table with fake players</p>
        </div>

        <div className="create-hint">
          <p>You'll customize your character next</p>
        </div>
      </div>
    </div>
  );
};

export default CreateLobby;
