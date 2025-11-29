import React from 'react';
import { useGame } from '../../context/GameContextMultiplayer';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';
import Card from '../Card/Card';
import Controls from '../Controls/Controls';
import './TopDownTable.css';

/**
 * Top-Down Table Component
 * Bird's eye view of poker table with players positioned around it
 */
const TopDownTable = () => {
  const { gameState, playerData, ROUND_STATES, handleNextHand } = useGame();

  // Position players around the table (8 positions max)
  const getPlayerPosition = (index, totalPlayers) => {
    const positions = [
      { class: 'position-bottom' },      // Position 0 (current player)
      { class: 'position-left' },        // Position 1
      { class: 'position-top-left' },    // Position 2
      { class: 'position-top' },         // Position 3
      { class: 'position-top-right' },   // Position 4
      { class: 'position-right' },       // Position 5
      { class: 'position-bottom-right' }, // Position 6
      { class: 'position-bottom-left' }  // Position 7
    ];

    return positions[index] || positions[0];
  };

  const players = gameState.players || [];
  const communityCards = gameState.communityCards || [];
  const pot = gameState.pot || 0;
  const roundState = gameState.roundState;
  const dealerPosition = gameState.dealerPosition;
  const lastAction = gameState.lastAction;

  // Format round state for display
  const getRoundStateDisplay = () => {
    const stateMap = {
      [ROUND_STATES.WAITING]: 'Waiting for game',
      [ROUND_STATES.PRE_FLOP]: 'Pre-Flop',
      [ROUND_STATES.FLOP]: 'Flop',
      [ROUND_STATES.TURN]: 'Turn',
      [ROUND_STATES.RIVER]: 'River',
      [ROUND_STATES.SHOWDOWN]: 'Showdown',
      [ROUND_STATES.HAND_COMPLETE]: 'Hand Complete'
    };
    return stateMap[roundState] || roundState;
  };

  return (
    <div className="top-down-table">
      <div className="table-view">
        <div className="table-container">
          {/* Poker table surface */}
          <div className="poker-table-top">
            {/* Table felt */}
            <div className="table-felt-top">
              {/* Community cards in center */}
              <div className="community-cards-center">
                {/* Pot display removed - moved to sidebar */}

                <div className="community-cards-row">
                  {communityCards.length > 0 ? (
                    communityCards.map((card, index) => (
                      <Card
                        key={index}
                        suit={card.suit}
                        rank={card.rank}
                        faceDown={card.faceDown}
                        scale={0.8}
                      />
                    ))
                  ) : (
                    // Placeholder cards
                    <>
                      <Card faceDown scale={0.8} />
                      <Card faceDown scale={0.8} />
                      <Card faceDown scale={0.8} />
                      <Card faceDown scale={0.8} />
                      <Card faceDown scale={0.8} />
                    </>
                  )}
                </div>
              </div>

              {/* Players positioned around table */}
              {players.map((player, index) => {
                const position = getPlayerPosition(index, players.length);
                const isCurrentPlayer = player.name === playerData.name;
                const isDealer = index === dealerPosition;
                const isFolded = player.folded;
                const isAllIn = player.allIn;

                return (
                  <div
                    key={index}
                    className={`player-seat ${position.class} ${isCurrentPlayer ? 'current-player' : ''} ${gameState.currentPlayerIndex === index ? 'active-turn' : ''
                      } ${isFolded ? 'folded' : ''} ${isAllIn ? 'all-in' : ''}`}
                  >


                    {/* Dealer button */}
                    {isDealer && (
                      <div className="dealer-button" title="Dealer">D</div>
                    )}

                    {/* Player character - full size */}
                    <div className="seat-player-character" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '128px', flexShrink: 0 }}>
                      <PlayerAvatar
                        avatarId={player.avatar}
                        name={player.name}
                        scale={2}
                        showName={true}
                      />
                      {isAllIn && <div className="all-in-badge">ALL IN</div>}
                      {isFolded && <div className="folded-badge">FOLDED</div>}
                    </div>

                    {/* Player's cards - only show for current player */}
                    {!isFolded && isCurrentPlayer && player.hand && player.hand.length > 0 && (
                      <div className="seat-cards">
                        {player.hand.map((card, cardIndex) => (
                          <Card
                            key={cardIndex}
                            suit={card.suit}
                            rank={card.rank}
                            scale={0.4}
                          />
                        ))}
                      </div>
                    )}

                    {/* Current bet */}
                    {player.currentBet > 0 && !isFolded && (
                      <div className="player-bet">
                        <div className="bet-chip">💰</div>
                        <div className="bet-value">${player.currentBet}</div>
                      </div>
                    )}

                    {/* Active turn indicator */}
                    {gameState.currentPlayerIndex === index && !isFolded && !isAllIn && (
                      <div className="turn-arrow">▼</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Game status message */}
          {/* Game status message - Only show for important events */}
          {(lastAction?.type === 'showdown' || lastAction?.type === 'error') && (
            <div className="game-status-bar">
              <div className="status-info">
                {lastAction && lastAction.type === 'showdown' && (
                  <div className="status-item showdown-result">
                    <span className="status-label">Winner:</span>
                    <span className="status-value">
                      {lastAction.winners.map(w => w.name).join(', ')} - {lastAction.winningHand?.name}
                    </span>
                    <button className="next-hand-btn" onClick={handleNextHand}>
                      Next Hand
                    </button>
                  </div>
                )}
                {lastAction && lastAction.type === 'error' && (
                  <div className="status-item error-message">
                    {lastAction.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Game controls */}
          {roundState !== ROUND_STATES.SHOWDOWN && roundState !== ROUND_STATES.WAITING && (
            <Controls />
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="game-sidebar">
        <div className="sidebar-header">
          <h3>TABLE INFO</h3>
        </div>

        <div className="sidebar-pot">
          <div className="sidebar-label">CURRENT POT</div>
          <div className="sidebar-value">${pot}</div>
        </div>

        <div className="sidebar-players">
          <div className="sidebar-label">PLAYERS</div>
          <div className="player-list-items">
            {players.map((p, i) => {
              const isSB = i === (dealerPosition + 1) % players.length;
              const isBB = i === (dealerPosition + 2) % players.length;
              const isDealer = i === dealerPosition;
              const isTurn = gameState.currentPlayerIndex === i;

              return (
                <div key={i} className={`sidebar-player-item ${isTurn ? 'active' : ''} ${p.folded ? 'folded' : ''}`}>
                  <div className="player-row-main">
                    {isTurn && <span className="turn-indicator">▶</span>}
                    <span className="player-name">{p.name}</span>
                    <span className="player-chips">${p.chips}</span>
                  </div>
                  <div className="player-row-badges">
                    {isDealer && <span className="badge dealer">D</span>}
                    {isSB && <span className="badge sb">SB</span>}
                    {isBB && <span className="badge bb">BB</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopDownTable;
