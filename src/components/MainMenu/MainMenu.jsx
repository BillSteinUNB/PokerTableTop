import React from 'react';
import { useGame } from '../../context/GameContextMultiplayer';
import './MainMenu.css';

/**
 * Main Menu Component
 * Starting screen with Join Game and Create Lobby options
 */
const MainMenu = () => {
  const { navigateTo } = useGame();

  const handleJoinGame = () => {
    navigateTo('joinGame');
  };

  const handleCreateLobby = () => {
    navigateTo('createLobby');
  };

  return (
    <div className="main-menu">
      <div className="menu-container">
        {/* Animated title */}
        <div className="game-logo">
          <h1 className="logo-text">
            <span className="logo-pixel">♠</span>
            PIXEL POKER
            <span className="logo-pixel">♥</span>
          </h1>
          <div className="logo-subtitle">~ Multiplayer Edition ~</div>
        </div>

        {/* Menu buttons */}
        <div className="menu-buttons">
          <button className="menu-btn btn-join" onClick={handleJoinGame}>
            <div className="btn-icon">🎮</div>
            <div className="btn-text">JOIN GAME</div>
            <div className="btn-hint">Enter lobby code</div>
          </button>

          <button className="menu-btn btn-create" onClick={handleCreateLobby}>
            <div className="btn-icon">🎲</div>
            <div className="btn-text">CREATE LOBBY</div>
            <div className="btn-hint">Start a new game</div>
          </button>
        </div>

        {/* Decorative elements */}
        <div className="menu-decoration">
          <div className="decoration-card card-left">♣</div>
          <div className="decoration-card card-right">♦</div>
        </div>

        {/* Footer */}
        <div className="menu-footer">
          <p>Press any button to start</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
