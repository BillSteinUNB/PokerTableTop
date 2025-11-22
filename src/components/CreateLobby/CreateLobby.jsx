import React from 'react';
import { useGame } from '../../context/GameContext';
import { initializeGame, startNewHand } from '../../utils/gameEngine';
import './CreateLobby.css';

/**
 * Create Lobby Component
 * Screen for creating a new game lobby (goes to character select first)
 */
const CreateLobby = () => {
  const { navigateTo, updatePlayerData, createLobby, lobbyData, setGameState } = useGame();

  const handleContinue = () => {
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

    // Use game engine to initialize and start game
    const gameSettings = {
      smallBlind: 5,
      bigBlind: 10,
      startingChips: 1000,
      minPlayers: 2,
      maxPlayers: 8
    };

    const initialGameState = initializeGame(allPlayers, gameSettings);
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
