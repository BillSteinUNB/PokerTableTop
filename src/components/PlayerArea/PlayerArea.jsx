import React from 'react';
import Card from '../Card/Card';
import Chip from '../Chip/Chip';
import './PlayerArea.css';

/**
 * Player Area Component
 * Shows player's hand, chips, and current bet
 *
 * @param {string} playerName - Name of the player
 * @param {number} chipCount - Total chips/money
 * @param {number} currentBet - Current bet amount
 * @param {boolean} isActive - Whether it's player's turn
 */
const PlayerArea = ({
  playerName = 'Player 1',
  chipCount = 1000,
  currentBet = 0,
  isActive = false
}) => {
  return (
    <div className={`player-area ${isActive ? 'active' : ''}`}>
      {/* Player info bar */}
      <div className="player-info">
        <div className="player-name">{playerName}</div>
        <div className="player-chips">
          <span className="chip-icon">●</span>
          ${chipCount}
        </div>
      </div>

      {/* Player's hand */}
      <div className="player-hand">
        <Card suit="spades" rank="A" scale={1.5} />
        <Card suit="spades" rank="K" scale={1.5} />
      </div>

      {/* Current bet display */}
      {currentBet > 0 && (
        <div className="current-bet">
          <div className="bet-chips">
            <Chip value={100} scale={1.5} />
            <Chip value={25} scale={1.5} />
            <Chip value={5} scale={1.5} />
          </div>
          <div className="bet-amount">${currentBet}</div>
        </div>
      )}

      {/* Active turn indicator */}
      {isActive && (
        <div className="turn-indicator">
          <div className="indicator-arrow">▼</div>
          YOUR TURN
        </div>
      )}
    </div>
  );
};

export default PlayerArea;
