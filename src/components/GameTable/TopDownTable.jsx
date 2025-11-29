import React from 'react';
import { useGame } from '../../context/GameContextMultiplayer';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';
import Card from '../Card/Card';
import Controls from '../Controls/Controls';
import Chip from '../Chip/Chip';
import { CARD_SPRITE_CONFIG } from '../../utils/spriteConfig';
import './TopDownTable.css';

/**
 * Top-Down Table Component
 * Bird's eye view of poker table with players positioned around it
 */
const TopDownTable = () => {
  const { gameState, playerData, ROUND_STATES, handleNextHand } = useGame();

  // Calculate chip stack size based on pot (1-4)
  const chipStackSize = gameState.pot > 0
    ? Math.min(4, Math.max(1, Math.floor(gameState.pot / 200) + 1))
    : 0;

  // Position players around the table based on total count and user's position
  const getPlayerPosition = (index, totalPlayers) => {
    // Find the current user's index to rotate the table
    const myIndex = players.findIndex(p => p.name === playerData.name);
    const baseIndex = myIndex === -1 ? 0 : myIndex;

    // Calculate relative index (0 is always the current user)
    const relativeIndex = (index - baseIndex + totalPlayers) % totalPlayers;

    let positionClass = 'position-bottom';

    // Define layouts based on total player count as requested
    if (totalPlayers === 2) {
      // 2 Players: Bottom, Top
      const map = ['position-bottom', 'position-top'];
      positionClass = map[relativeIndex];
    } else if (totalPlayers === 3) {
      // 3 Players: Bottom, Top, Left
      const map = ['position-bottom', 'position-top', 'position-left'];
      positionClass = map[relativeIndex];
    } else if (totalPlayers === 4) {
      // 4 Players: Bottom, Top, Left, Right
      const map = ['position-bottom', 'position-top', 'position-left', 'position-right'];
      positionClass = map[relativeIndex];
    } else if (totalPlayers === 5) {
      // 5 Players: Add Top-Left
      const map = ['position-bottom', 'position-top', 'position-left', 'position-right', 'position-top-left'];
      positionClass = map[relativeIndex];
    } else if (totalPlayers === 6) {
      // 6 Players: Add Top-Right
      const map = ['position-bottom', 'position-top', 'position-left', 'position-right', 'position-top-left', 'position-top-right'];
      positionClass = map[relativeIndex];
    } else {
      // 7+ Players: Fill all diagonals
      const map = [
        'position-bottom',
        'position-top',
        'position-left',
        'position-right',
        'position-top-left',
        'position-top-right',
        'position-bottom-left',
        'position-bottom-right'
      ];
      positionClass = map[relativeIndex] || 'position-top';
    }

    return { class: positionClass };
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
      {/* Left Sidebar - Controls */}
      <div className="game-sidebar left">
        <Controls />
      </div>

      <div className="table-view">
        <div className="table-container">
          {/* Poker table surface */}
          <div className="poker-table-top">
            {/* Table felt */}
            <div className="table-felt-top">

              {/* Table Decorations (Deck & Chips) */}
              <div className="table-decorations">
                <div className="deck-placeholder">
                  <img
                    src="/assets/cards/cardpile.png"
                    alt="Deck"
                    style={{
                      width: `${CARD_SPRITE_CONFIG.cardWidth * 0.4}px`,
                      height: `${CARD_SPRITE_CONFIG.cardHeight * 0.4}px`,
                      imageRendering: 'pixelated',
                      display: 'block'
                    }}
                  />
                </div>
                <div className="pot-chips-visual">
                  {chipStackSize > 0 && (
                    <Chip color="red" stackSize={chipStackSize} scale={0.8} />
                  )}
                </div>
              </div>

              {/* Community cards in center */}
              <div className="community-cards-center">
                <div className="community-cards-row">
                  {communityCards.length > 0 ? (
                    communityCards.map((card, index) => (
                      <Card
                        key={index}
                        suit={card.suit}
                        rank={card.rank}
                        faceDown={card.faceDown}
                        scale={0.4}
                      />
                    ))
                  ) : (
                    // Placeholder cards
                    <>
                      <Card faceDown scale={0.4} />
                      <Card faceDown scale={0.4} />
                      <Card faceDown scale={0.4} />
                      <Card faceDown scale={0.4} />
                      <Card faceDown scale={0.4} />
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

                    {/* Player's cards - only show for current player */}
                    {!isFolded && isCurrentPlayer && player.hand && player.hand.length > 0 && (
                      <div className="seat-cards" style={{ marginBottom: '8px', marginTop: 0 }}>
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

                    {/* Player character - full size */}
                    <div className="seat-player-character" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '128px', flexShrink: 0 }}>
                      <PlayerAvatar
                        avatarId={player.avatar}
                        name={player.name}
                        scale={2}
                        showName={!isCurrentPlayer}
                      />
                      {isAllIn && <div className="all-in-badge">ALL IN</div>}
                      {isFolded && <div className="folded-badge">FOLDED</div>}
                    </div>

                    {/* Active turn indicator */}
                    {gameState.currentPlayerIndex === index && !isFolded && !isAllIn && (
                      <div className="turn-arrow">▼</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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

          {/* Controls removed from here */}
        </div>
      </div>

      {/* Right Sidebar - Info */}
      <div className="game-sidebar right">
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
