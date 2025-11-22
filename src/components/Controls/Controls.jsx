import React, { useState } from 'react';
import './Controls.css';

/**
 * Game Controls Component
 * Player action buttons and bet controls
 */
const Controls = () => {
  const [betAmount, setBetAmount] = useState(0);

  const handleAction = (action) => {
    console.log(`Player action: ${action}`, { betAmount });
    // TODO: Implement game logic
  };

  const adjustBet = (amount) => {
    setBetAmount(Math.max(0, betAmount + amount));
  };

  return (
    <div className="controls-container">
      {/* Bet slider section */}
      <div className="bet-controls">
        <div className="bet-label">BET AMOUNT</div>
        <div className="bet-display">${betAmount}</div>

        <div className="bet-buttons">
          <button
            className="bet-adjust-btn"
            onClick={() => adjustBet(-50)}
          >
            -50
          </button>
          <button
            className="bet-adjust-btn"
            onClick={() => adjustBet(-10)}
          >
            -10
          </button>
          <button
            className="bet-adjust-btn"
            onClick={() => adjustBet(10)}
          >
            +10
          </button>
          <button
            className="bet-adjust-btn"
            onClick={() => adjustBet(50)}
          >
            +50
          </button>
        </div>

        <input
          type="range"
          min="0"
          max="1000"
          step="10"
          value={betAmount}
          onChange={(e) => setBetAmount(Number(e.target.value))}
          className="bet-slider"
        />
      </div>

      {/* Action buttons */}
      <div className="action-buttons">
        <button
          className="action-btn btn-fold"
          onClick={() => handleAction('fold')}
        >
          FOLD
        </button>
        <button
          className="action-btn btn-check"
          onClick={() => handleAction('check')}
        >
          CHECK
        </button>
        <button
          className="action-btn btn-call"
          onClick={() => handleAction('call')}
        >
          CALL
        </button>
        <button
          className="action-btn btn-raise"
          onClick={() => handleAction('raise')}
        >
          RAISE
        </button>
        <button
          className="action-btn btn-all-in"
          onClick={() => handleAction('all-in')}
        >
          ALL IN
        </button>
      </div>
    </div>
  );
};

export default Controls;
