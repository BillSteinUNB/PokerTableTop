import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContextMultiplayer';
import soundManager from '../../services/soundManager';
import './Controls.css';

/**
 * Game Controls Component
 * Player action buttons and bet controls
 * Rendered inside the Left Sidebar
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

    // Play appropriate sound
    // Sound handled in GameContext now to cover bots as well

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

  const setPotBet = (multiplier) => {
    const pot = gameState.pot || 0;
    const potRaise = Math.floor(pot * multiplier);
    const targetAmount = gameState.currentBet + potRaise;
    const maxBet = currentPlayer?.chips + currentPlayer?.currentBet || 0;
    const minRaise = getMinimumRaise();
    setBetAmount(Math.max(minRaise, Math.min(targetAmount, maxBet)));
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

  // If not my turn, show waiting message
  if (!isMyTurn) {
    return (
      <div className="controls-sidebar-content">
        <div className="sidebar-header">
          <h3>ACTIONS</h3>
        </div>
        <div className="sidebar-message">
          Waiting for turn...
        </div>
        <div className="sidebar-pot" style={{ marginTop: '20px' }}>
          <div className="sidebar-label">YOUR CHIPS</div>
          <div className="sidebar-value">
            ${gameState.players?.find(p => p.name === playerData.name)?.chips || 0}
          </div>
        </div>
      </div>
    );
  }

  // Determine if All-In is effectively a Call
  const isCallAllIn = callAmount >= (currentPlayer?.chips || 0);

  return (
    <div className="controls-sidebar-content">
      <div className="sidebar-header">
        <h3>ACTIONS</h3>
      </div>

      {/* Player Info */}
      <div className="sidebar-pot">
        <div className="sidebar-label">YOUR CHIPS</div>
        <div className="sidebar-value">${currentPlayer?.chips || 0}</div>
      </div>

      <div className="sidebar-pot">
        <div className="sidebar-label">TO CALL</div>
        <div className="sidebar-value">${callAmount}</div>
      </div>

      {/* Bet Controls */}
      {validActions.includes('raise') && (
        <div className="bet-controls-panel">
          <div className="bet-label">RAISE AMOUNT</div>
          <div className="bet-display">${betAmount}</div>

          <div className="bet-buttons-row">
            <button className="bet-adjust-btn" onClick={() => adjustBet(-gameState.settings?.bigBlind || -10)}>-BB</button>
            <button className="bet-adjust-btn" onClick={() => adjustBet(gameState.settings?.bigBlind || 10)}>+BB</button>
            <button className="bet-adjust-btn" onClick={() => setPotBet(0.5)}>1/2 POT</button>
            <button className="bet-adjust-btn" onClick={() => setPotBet(1)}>POT</button>
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
        </div>
      )}

      {/* Action Buttons - Vertical Stack */}
      <div className="action-buttons-vertical">
        {validActions.includes('fold') && (
          <button className="action-btn btn-fold" onClick={() => handleAction('fold')}>
            FOLD
          </button>
        )}

        {validActions.includes('check') && (
          <button className="action-btn btn-check" onClick={() => handleAction('check')}>
            CHECK
          </button>
        )}

        {validActions.includes('call') && (
          <button className="action-btn btn-call" onClick={() => handleAction('call')}>
            CALL ${callAmount}
          </button>
        )}

        {validActions.includes('raise') && (
          <button className="action-btn btn-raise" onClick={() => handleAction('raise')}>
            RAISE ${betAmount}
          </button>
        )}

        {validActions.includes('all-in') && (
          <button className="action-btn btn-all-in" onClick={() => handleAction('all-in')}>
            {isCallAllIn ? 'CALL ALL-IN' : 'ALL IN'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Controls;
