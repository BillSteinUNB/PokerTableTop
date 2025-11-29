import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContextMultiplayer';
import { CHARACTERS } from '../../data/gameData';
import './Lobby.css';

/**
 * Lobby Component
 * Waiting room showing players and lobby settings before game starts
 */
const Lobby = () => {
  const { lobbyData, createLobby, playerData, startGame, navigateTo, updateLobbySettings, readyUp, isReady } = useGame();
  const [editingSettings, setEditingSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState(lobbyData.settings || {});

  useEffect(() => {
    // If no lobby exists and we're the host, create one
    if (!lobbyData.code) {
      createLobby();
    }
  }, []);

  useEffect(() => {
    // Update local settings when lobby data changes
    if (lobbyData.settings) {
      setLocalSettings(lobbyData.settings);
    }
  }, [lobbyData.settings]);

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: parseInt(value) || 0
    }));
  };

  const handleSaveSettings = () => {
    updateLobbySettings(localSettings);
    setEditingSettings(false);
  };

  const handleCancelEdit = () => {
    setLocalSettings(lobbyData.settings);
    setEditingSettings(false);
  };

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

  const handleReadyToggle = async () => {
    try {
      await readyUp(!isReady);
    } catch (error) {
      console.error('Failed to ready up:', error);
    }
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

        {/* Previous Winner Banner */}
        {lobbyData.lastWinner && (
          <div className="previous-winner-banner">
            🏆 Previous Winner: <strong>{lobbyData.lastWinner.name}</strong> 🏆
          </div>
        )}

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
              {players.map((player, index) => {
                // Find the character data for this player's avatar
                const characterData = CHARACTERS.find(c => c.id === (player.avatar || 0)) || CHARACTERS[0];

                return (
                  <div key={player.id || index} className="player-card">
                    <div className="player-avatar">
                      <img
                        src={characterData.imagePath}
                        alt={characterData.name}
                        className="player-avatar-image"
                        onError={(e) => {
                          // Fallback to emoji if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <span className="player-emoji" style={{ display: 'none' }}>
                        {characterData.emoji}
                      </span>
                    </div>
                    <div className="player-info">
                      <div className="player-name">{player.name}</div>
                      <div className="player-details">
                        <span className="detail-item">Card: {player.cardColor}</span>
                        <span className="detail-item">Chip: {player.chipType}</span>
                      </div>
                      {player.ready && (
                        <div className="ready-badge">✓ READY</div>
                      )}
                    </div>
                    {player.id === lobbyData.players?.[0]?.id && (
                      <div className="player-badge">👑</div>
                    )}
                  </div>
                );
              })}

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
              {lobbyData.isHost && !editingSettings && (
                <button className="edit-settings-btn" onClick={() => setEditingSettings(true)}>
                  ✏️ EDIT
                </button>
              )}
            </div>

            {!editingSettings ? (
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
                  <span className="setting-label">Ante</span>
                  <span className="setting-value">{lobbyData.settings.ante || 0}</span>
                </div>
                <div className="setting-item">
                  <span className="setting-label">Max Players</span>
                  <span className="setting-value">{lobbyData.settings.maxPlayers}</span>
                </div>
              </div>
            ) : (
              <div className="settings-edit">
                <div className="setting-edit-item">
                  <label className="setting-edit-label">Starting Chips</label>
                  <input
                    type="number"
                    className="setting-edit-input"
                    value={localSettings.startingChips}
                    onChange={(e) => handleSettingChange('startingChips', e.target.value)}
                    min="100"
                    max="100000"
                    step="100"
                  />
                </div>
                <div className="setting-edit-item">
                  <label className="setting-edit-label">Small Blind</label>
                  <input
                    type="number"
                    className="setting-edit-input"
                    value={localSettings.smallBlind}
                    onChange={(e) => handleSettingChange('smallBlind', e.target.value)}
                    min="1"
                    max="1000"
                    step="1"
                  />
                </div>
                <div className="setting-edit-item">
                  <label className="setting-edit-label">Big Blind</label>
                  <input
                    type="number"
                    className="setting-edit-input"
                    value={localSettings.bigBlind}
                    onChange={(e) => handleSettingChange('bigBlind', e.target.value)}
                    min="2"
                    max="2000"
                    step="1"
                  />
                </div>
                <div className="setting-edit-item">
                  <label className="setting-edit-label">Ante</label>
                  <input
                    type="number"
                    className="setting-edit-input"
                    value={localSettings.ante || 0}
                    onChange={(e) => handleSettingChange('ante', e.target.value)}
                    min="0"
                    max="1000"
                    step="1"
                  />
                </div>
                <div className="setting-edit-item">
                  <label className="setting-edit-label">Max Players</label>
                  <input
                    type="number"
                    className="setting-edit-input"
                    value={localSettings.maxPlayers}
                    onChange={(e) => handleSettingChange('maxPlayers', e.target.value)}
                    min="2"
                    max="8"
                    step="1"
                  />
                </div>
                <div className="settings-edit-buttons">
                  <button className="settings-edit-btn save" onClick={handleSaveSettings}>
                    ✓ SAVE
                  </button>
                  <button className="settings-edit-btn cancel" onClick={handleCancelEdit}>
                    ✗ CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lobby-buttons">
          <button className="lobby-btn btn-leave" onClick={handleLeaveLobby}>
            ← LEAVE
          </button>
          {!lobbyData.isHost && (
            <button
              className={`lobby-btn btn-ready ${isReady ? 'ready' : ''}`}
              onClick={handleReadyToggle}
            >
              {isReady ? '✓ READY' : 'READY UP'}
            </button>
          )}
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
