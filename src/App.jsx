import React from 'react';
import GameTable from './components/GameTable/GameTable';
import DealerArea from './components/DealerArea/DealerArea';
import PlayerArea from './components/PlayerArea/PlayerArea';
import Controls from './components/Controls/Controls';
import './App.css';

/**
 * Main App Component
 * Pixel-art arcade poker game
 */
function App() {
  return (
    <div className="app">
      <GameTable>
        {/* Game title/header */}
        <div className="game-header">
          <h1 className="game-title">
            <span className="title-pixel">◆</span>
            PIXEL POKER
            <span className="title-pixel">◆</span>
          </h1>
          <div className="game-subtitle">~ Retro Arcade Edition ~</div>
        </div>

        {/* Dealer and community cards area */}
        <DealerArea />

        {/* Player hand area */}
        <PlayerArea
          playerName="Player 1"
          chipCount={1500}
          currentBet={150}
          isActive={true}
        />

        {/* Game controls */}
        <Controls />

        {/* Status message area */}
        <div className="status-message">
          <div className="message-text">
            Place your bets! Good luck!
          </div>
        </div>
      </GameTable>
    </div>
  );
}

export default App;
