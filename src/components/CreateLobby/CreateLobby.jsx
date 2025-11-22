import React from 'react';
import { useGame } from '../../context/GameContext';
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

    // Create lobby code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create 3 fake players for demo
    const fakePlayers = [
      { name: 'Alice', avatar: 1, cardColor: 'red', chipType: 'red', chips: 1000, hand: [], currentBet: 0, folded: false, position: 1 },
      { name: 'Bob', avatar: 2, cardColor: 'blue', chipType: 'blue', chips: 1000, hand: [], currentBet: 0, folded: false, position: 2 },
      { name: 'Charlie', avatar: 3, cardColor: 'green', chipType: 'green', chips: 1000, hand: [], currentBet: 0, folded: false, position: 3 }
    ];

    // Initialize game state for demo
    setGameState({
      pot: 150,
      currentPlayerIndex: 0,
      communityCards: [
        { suit: 'hearts', rank: 'A', faceDown: false },
        { suit: 'diamonds', rank: 'K', faceDown: false },
        { suit: 'clubs', rank: 'Q', faceDown: false },
        { suit: null, rank: null, faceDown: true },
        { suit: null, rank: null, faceDown: true }
      ],
      players: [
        {
          ...demoPlayer,
          chips: 1000,
          hand: [
            { suit: 'spades', rank: 'A' },
            { suit: 'spades', rank: 'K' }
          ],
          currentBet: 50,
          folded: false,
          position: 0
        },
        ...fakePlayers
      ],
      roundState: 'flop'
    });

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
