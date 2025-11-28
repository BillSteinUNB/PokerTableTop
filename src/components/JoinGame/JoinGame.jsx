import React, { useState } from 'react';
import { useGame } from '../../context/GameContextMultiplayer';
import { socketService } from '../../services/socket';
import './JoinGame.css';

/**
 * Join Game Component
 * Modal for entering lobby code to join existing game
 */
const JoinGame = () => {
  const { navigateTo } = useGame();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().slice(0, 6);
    setCode(value);
    setError('');
  };

  const handleJoin = async () => {
    if (code.length !== 6) {
      setError('Code must be 6 characters');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      // Connect to server and validate lobby exists
      await socketService.connect();

      // Check if the lobby exists
      await socketService.checkLobby(code);

      // Store the lobby code so CharacterSelection knows we're joining
      console.log('[JoinGame] Lobby validated, storing code:', code);
      sessionStorage.setItem('pendingLobbyCode', code);
      navigateTo('characterSelect');
    } catch (error) {
      console.error('[JoinGame] Error validating lobby:', error);
      setError(error.message || 'Failed to validate lobby code');
    } finally {
      setIsValidating(false);
    }
  };

  const handleBack = () => {
    navigateTo('mainMenu');
  };

  return (
    <div className="join-game">
      <div className="join-container">
        <div className="join-header">
          <h2 className="join-title">JOIN GAME</h2>
          <p className="join-subtitle">Enter the 6-digit lobby code</p>
        </div>

        <div className="code-input-section">
          <input
            type="text"
            className="code-input"
            value={code}
            onChange={handleCodeChange}
            placeholder="XXXXXX"
            maxLength={6}
            autoFocus
            disabled={isValidating}
          />
          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="join-buttons">
          <button className="join-btn btn-back" onClick={handleBack} disabled={isValidating}>
            ← BACK
          </button>
          <button
            className="join-btn btn-confirm"
            onClick={handleJoin}
            disabled={code.length !== 6 || isValidating}
          >
            {isValidating ? 'VALIDATING...' : 'JOIN →'}
          </button>
        </div>

        <div className="join-hint">
          <p>Ask the host for the lobby code</p>
        </div>
      </div>
    </div>
  );
};

export default JoinGame;
