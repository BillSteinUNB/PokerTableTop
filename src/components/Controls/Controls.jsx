import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContextMultiplayer';
import './Controls.css';

/**
 * Game Controls Component
 * Player action buttons and bet controls
 */
const Controls = () => {
  const {
    gameState,
    handlePlayerAction,
    getPlayerValidActions,
    getMinimumRaise,
    playerData
  } = useGame();

  const [betAmount, setBetAmount] = useState(0);
  const [validActions, setValidActions] = useState([]);

  // Get current player
  const currentPlayer = gameState.players?.[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.name === playerData.name;

  // Update valid actions when game state changes
  useEffect(() => {
    if (isMyTurn) {
      const actions = getPlayerValidActions();
      setValidActions(actions);

      // Set default bet amount to minimum raise
      if (actions.includes('raise')) {
        const minRaise = getMinimumRaise();
        setBetAmount(minRaise);
      }
    }
  }, [gameState, isMyTurn, getPlayerValidActions, getMinimumRaise]);

  const handleAction = (action) => {
    if (!isMyTurn || !validActions.includes(action)) {
      return;
    }

    if (action === 'raise') {
      handlePlayerAction('raise', betAmount);
    } else {
      handlePlayerAction(action);
    }
  };

  const adjustBet = (amount) => {
    const newAmount = Math.max(getMinimumRaise(), betAmount + amount);
    const maxBet = currentPlayer?.chips + currentPlayer?.currentBet || 0;
    setBetAmount(Math.min(newAmount, maxBet));
  };

  const handleSliderChange = (e) => {
    const value = Number(e.target.value);
    setBetAmount(Math.max(getMinimumRaise(), value));
  };

  // Calculate call amount
  const callAmount = currentPlayer
    ? gameState.currentBet - currentPlayer.currentBet
    : 0;

  const maxBet = currentPlayer?.chips + currentPlayer?.currentBet || 1000;

  if (!isMyTurn) {
    return (
      <div className="controls-container">
        <div className="waiting-message">
          <p>Waiting for {currentPlayer?.name || 'player'}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="controls-container">
      {/* Bet slider section */}
      {validActions.includes('raise') && (
        <div className="bet-controls">
          <div className="bet-label">RAISE AMOUNT</div>
          <div className="bet-display">${betAmount}</div>

          <div className="bet-buttons">
            <button
              className="bet-adjust-btn"
              onClick={() => adjustBet(-gameState.settings?.bigBlind || -10)}
            >
              -BB
            </button>
            <button
              className="bet-adjust-btn"
              onClick={() => adjustBet(-(gameState.settings?.smallBlind || -5))}
            >
              -SB
            </button>
            <button
              className="bet-adjust-btn"
              onClick={() => adjustBet(gameState.settings?.smallBlind || 5)}
            >
              +SB
            </button>
            <button
              className="bet-adjust-btn"
              onClick={() => adjustBet(gameState.settings?.bigBlind || 10)}
            >
              +BB
            </button>
          </div>

          <input
            type="range"
            min={getMinimumRaise()}
            max={maxBet}
            step={gameState.settings?.smallBlind || 5}
            value={betAmount}
            onChange={handleSliderChange}
            className="bet-slider"
          />
          <div className="slider-labels">
            <span>${getMinimumRaise()}</span>
            <span>${maxBet}</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="action-buttons">
        {validActions.includes('fold') && (
          <button
            className="action-btn btn-fold"
            onClick={() => handleAction('fold')}
          >
            FOLD
          </button>
        )}

        {validActions.includes('check') && (
          <button
            className="action-btn btn-check"
            onClick={() => handleAction('check')}
          >
            CHECK
          </button>
        )}

        {validActions.includes('call') && (
          <button
            className="action-btn btn-call"
            onClick={() => handleAction('call')}
          >
            CALL ${callAmount}
          </button>
        )}

        {validActions.includes('raise') && (
          <button
            className="action-btn btn-raise"
            onClick={() => handleAction('raise')}
          >
            RAISE ${betAmount}
          </button>
        )}

        {validActions.includes('all-in') && (
          <button
            className="action-btn btn-all-in"
            onClick={() => handleAction('all-in')}
          >
            ALL IN ${currentPlayer?.chips || 0}
          </button>
        )}
      </div>

      {/* Player info */}
      <div className="player-info">
        <div className="info-item">
          <span className="info-label">Your Chips:</span>
          <span className="info-value">${currentPlayer?.chips || 0}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Current Bet:</span>
          <span className="info-value">${currentPlayer?.currentBet || 0}</span>
        </div>
        <div className="info-item">
          <span className="info-label">To Call:</span>
          <span className="info-value">${callAmount}</span>
        </div>
      </div>
    </div>
  );
};

export default Controls;
