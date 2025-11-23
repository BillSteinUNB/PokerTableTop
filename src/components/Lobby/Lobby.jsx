import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContextMultiplayer';
import './Lobby.css';

/**
 * Lobby Component
 * Waiting room showing players and lobby settings before game starts
 */
const Lobby = () => {
  const { lobbyData, createLobby, playerData, startGame, navigateTo, updateLobbySettings } = useGame();

  useEffect(() => {
    // If no lobby exists and we're the host, create one
    if (!lobbyData.code) {
      createLobby();
    }
  }, []);

  const handleStartGame = () => {
    startGame();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(lobbyData.code);
    // Could add a toast notification here
  };

  const handleLeaveLobby = () => {
    navigateTo('mainMenu');
  };

  // Get players from lobby data (comes from server in multiplayer mode)
  const players = lobbyData.players || [];

  return (
    <div className="lobby">
      <div className="lobby-container">
        <div className="lobby-header">
          <h2 className="lobby-title">LOBBY</h2>
          <div className="lobby-code-section">
            <div className="code-label">LOBBY CODE</div>
            <div className="lobby-code">
              {lobbyData.code || 'XXXXXX'}
              <button className="copy-btn" onClick={handleCopyCode} title="Copy code">
                📋
              </button>
            </div>
          </div>
        </div>

        <div className="lobby-content">
          {/* Players List */}
          <div className="players-section">
            <div className="section-header">
              <span className="section-title">PLAYERS ({players.length}/{lobbyData.settings?.maxPlayers || 8})</span>
              {lobbyData.isHost && (
                <span className="host-badge">HOST</span>
              )}
            </div>

            <div className="players-list">
              {players.map((player, index) => (
                <div key={player.id || index} className="player-card">
                  <div className="player-avatar">
                    <span className="player-emoji">
                      {['😎', '🤖', '🤠', '🏴‍☠️', '🥷', '🧙', '⚔️', '👽'][player.avatar || 0]}
                    </span>
                  </div>
                  <div className="player-info">
                    <div className="player-name">{player.name}</div>
                    <div className="player-details">
                      <span className="detail-item">Card: {player.cardColor}</span>
                      <span className="detail-item">Chip: {player.chipType}</span>
                    </div>
                  </div>
                  {player.id === lobbyData.players?.[0]?.id && (
                    <div className="player-badge">👑</div>
                  )}
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: (lobbyData.settings?.maxPlayers || 8) - players.length }).map((_, index) => (
                <div key={`empty-${index}`} className="player-card empty">
                  <div className="player-avatar empty-avatar">?</div>
                  <div className="player-info">
                    <div className="player-name">Waiting...</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings Section */}
          <div className="settings-section">
            <div className="section-header">
              <span className="section-title">SETTINGS</span>
            </div>

            <div className="settings-list">
              <div className="setting-item">
                <span className="setting-label">Starting Chips</span>
                <span className="setting-value">{lobbyData.settings.startingChips}</span>
              </div>
              <div className="setting-item">
                <span className="setting-label">Small Blind</span>
                <span className="setting-value">{lobbyData.settings.smallBlind}</span>
              </div>
              <div className="setting-item">
                <span className="setting-label">Big Blind</span>
                <span className="setting-value">{lobbyData.settings.bigBlind}</span>
              </div>
              <div className="setting-item">
                <span className="setting-label">Max Players</span>
                <span className="setting-value">{lobbyData.settings.maxPlayers}</span>
              </div>
            </div>

            {lobbyData.isHost && (
              <div className="settings-note">
                <p>⚙️ Settings can be adjusted later</p>
              </div>
            )}
          </div>
        </div>

        <div className="lobby-buttons">
          <button className="lobby-btn btn-leave" onClick={handleLeaveLobby}>
            ← LEAVE
          </button>
          {lobbyData.isHost && (
            <button
              className="lobby-btn btn-start"
              onClick={handleStartGame}
              disabled={players.length < 2}
            >
              START GAME →
            </button>
          )}
          {!lobbyData.isHost && (
            <div className="waiting-message">
              Waiting for host to start...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Lobby;
