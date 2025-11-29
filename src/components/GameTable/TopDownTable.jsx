import React, { useEffect, useState, useRef } from 'react';
import { useGame } from '../../context/GameContextMultiplayer';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';
import Card from '../Card/Card';
import Controls from '../Controls/Controls';
import Chip from '../Chip/Chip';
import ShowdownReveal from '../ShowdownReveal/ShowdownReveal';
import PlayerBetChips from '../PlayerBetChips/PlayerBetChips';
import { CARD_SPRITE_CONFIG } from '../../utils/spriteConfig';
import './TopDownTable.css';

/**
 * Top-Down Table Component
 * Bird's eye view of poker table with players positioned around it
 */
const TopDownTable = () => {
  const { gameState, playerData, ROUND_STATES, handleNextHand } = useGame();

  // Animation state
  const [flyingCards, setFlyingCards] = useState([]);
  const [cardsDealt, setCardsDealt] = useState(true);
  const [communityCardsDealt, setCommunityCardsDealt] = useState(0);
  const [lastCommunityCount, setLastCommunityCount] = useState(0);
  const [showingShowdown, setShowingShowdown] = useState(false);
  const feltRef = useRef(null);
  const deckRef = useRef(null);
  const seatRefs = useRef({});
  const communityRef = useRef(null);

  // Removed pot visual - now showing per-player bets instead

  // Show showdown reveal animation
  useEffect(() => {
    if (gameState.roundState === ROUND_STATES.SHOWDOWN && !showingShowdown) {
      setShowingShowdown(true);
    }
  }, [gameState.roundState, ROUND_STATES.SHOWDOWN, showingShowdown]);

  // Handle showdown reveal completion
  const handleShowdownComplete = () => {
    setShowingShowdown(false);
    handleNextHand();
  };

  // Trigger deal animation on new hand
  useEffect(() => {
    if (gameState.lastAction?.type === 'new-hand') {
      setCommunityCardsDealt(0);
      setLastCommunityCount(0);
      runDealAnimation();
    }
  }, [gameState.lastAction]);

  const runDealAnimation = () => {
    if (!feltRef.current || !deckRef.current) return;

    setCardsDealt(false);
    setFlyingCards([]);

    const feltRect = feltRef.current.getBoundingClientRect();
    const deckRect = deckRef.current.getBoundingClientRect();

    // Calculate deck position relative to felt
    const startX = deckRect.left - feltRect.left + (deckRect.width / 2) - 50;
    const startY = deckRect.top - feltRect.top + (deckRect.height / 2) - 50;

    const newFlyingCards = [];
    const players = gameState.players || [];
    const dealerPos = gameState.dealerPosition || 0;

    let cardCount = 0;

    // Deal 2 rounds (2 cards per player)
    for (let round = 0; round < 2; round++) {
      for (let i = 0; i < players.length; i++) {
        const playerIndex = (dealerPos + 1 + i) % players.length;
        const player = players[playerIndex];

        if (player.folded) continue;

        const seatEl = seatRefs.current[playerIndex];
        if (!seatEl) continue;

        const seatRect = seatEl.getBoundingClientRect();
        const targetX = (seatRect.left - feltRect.left) + (seatRect.width / 2);
        const targetY = (seatRect.top - feltRect.top) + (seatRect.height / 2);

        const delay = cardCount * 150;

        newFlyingCards.push({
          id: `card-${round}-${playerIndex}-${cardCount}`,
          startX,
          startY,
          targetX,
          targetY,
          delay,
          duration: 400
        });

        cardCount++;
      }
    }

    setFlyingCards(newFlyingCards);

    // After dealing to players, deal 5 community cards
    const communityRect = communityRef.current?.getBoundingClientRect();
    if (communityRect) {
      const communityTargetX = communityRect.left - feltRect.left + (communityRect.width / 2);
      const communityTargetY = communityRect.top - feltRect.top + (communityRect.height / 2);

      for (let i = 0; i < 5; i++) {
        const delay = (cardCount * 150) + (i * 150);
        newFlyingCards.push({
          id: `community-init-${i}-${Date.now()}`,
          startX,
          startY,
          targetX: communityTargetX,
          targetY: communityTargetY,
          delay,
          duration: 400
        });
      }
    }

    setFlyingCards(newFlyingCards);

    const totalDuration = ((cardCount + 5) * 150) + 400;
    setTimeout(() => {
      setFlyingCards([]);
      setCardsDealt(true);
      setCommunityCardsDealt(5); // All 5 placeholders are now dealt
    }, totalDuration);
  };

  // Position players around the table based on total count and user's position
  const getPlayerPosition = (index, totalPlayers) => {
    const myIndex = players.findIndex(p => p.name === playerData.name);
    const baseIndex = myIndex === -1 ? 0 : myIndex;
    const relativeIndex = (index - baseIndex + totalPlayers) % totalPlayers;

    let positionClass = 'position-bottom';

    if (totalPlayers === 2) {
      const map = ['position-bottom', 'position-top'];
      positionClass = map[relativeIndex];
    } else if (totalPlayers === 3) {
      const map = ['position-bottom', 'position-top', 'position-left'];
      positionClass = map[relativeIndex];
    } else if (totalPlayers === 4) {
      const map = ['position-bottom', 'position-top', 'position-left', 'position-right'];
      positionClass = map[relativeIndex];
    } else if (totalPlayers === 5) {
      const map = ['position-bottom', 'position-top', 'position-left', 'position-right', 'position-top-left'];
      positionClass = map[relativeIndex];
    } else if (totalPlayers === 6) {
      const map = ['position-bottom', 'position-top', 'position-left', 'position-right', 'position-top-left', 'position-top-right'];
      positionClass = map[relativeIndex];
    } else {
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

  return (
    <div className="top-down-table">
      {/* Showdown Reveal Overlay */}
      {showingShowdown && gameState.roundState === ROUND_STATES.SHOWDOWN && (
        <ShowdownReveal
          gameState={gameState}
          onComplete={handleShowdownComplete}
        />
      )}

      {/* Left Sidebar - Controls */}
      <div className="game-sidebar left">
        <Controls />
      </div>

      <div className="table-view">
        <div className="table-container">
          {/* Poker table surface */}
          <div className="poker-table-top">
            {/* Table felt */}
            <div className="table-felt-top" ref={feltRef}>

              {/* Table Decorations (Deck & Chips) */}
              <div className="table-decorations">
                <div className="deck-placeholder" ref={deckRef}>
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
              </div>

              {/* Flying Cards Animation */}
              {flyingCards.map((card) => (
                <div
                  key={card.id}
                  className="flying-card"
                  style={{
                    position: 'absolute',
                    left: `${card.startX}px`,
                    top: `${card.startY}px`,
                    zIndex: 100,
                    animation: `flyCard ${card.duration}ms ease-out forwards`,
                    animationDelay: `${card.delay}ms`,
                    '--target-x': `${card.targetX - card.startX}px`,
                    '--target-y': `${card.targetY - card.startY}px`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <Card faceDown scale={0.4} />
                </div>
              ))}

              {/* Community cards in center */}
              <div className="community-cards-center" ref={communityRef}>
                <div className="community-cards-row">
                  {communityCardsDealt > 0 && [...Array(5)].map((_, index) => {
                    const card = communityCards[index];

                    if (card) {
                      return (
                        <Card
                          key={index}
                          suit={card.suit}
                          rank={card.rank}
                          faceDown={card.faceDown}
                          scale={0.35}
                        />
                      );
                    } else {
                      // Show face-down placeholder
                      return (
                        <Card
                          key={`placeholder-${index}`}
                          faceDown
                          scale={0.35}
                        />
                      );
                    }
                  })}
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
                    ref={el => seatRefs.current[index] = el}
                    className={`player-seat ${position.class} ${isCurrentPlayer ? 'current-player' : ''} ${gameState.currentPlayerIndex === index ? 'active-turn' : ''
                      } ${isFolded ? 'folded' : ''} ${isAllIn ? 'all-in' : ''}`}
                  >

                    {/* Player's cards - show for all active players after deal */}
                    {!isFolded && cardsDealt && (
                      <div className="seat-cards" style={{ marginBottom: '8px', marginTop: 0 }}>
                        {isCurrentPlayer && player.hand && player.hand.length > 0 ? (
                          // Current player's hand - Face Up
                          player.hand.map((card, cardIndex) => (
                            <Card
                              key={cardIndex}
                              suit={card.suit}
                              rank={card.rank}
                              scale={0.4}
                            />
                          ))
                        ) : (
                          // Opponent's hand - Face Down
                          <>
                            <Card faceDown scale={0.4} />
                            <Card faceDown scale={0.4} />
                          </>
                        )}
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

                      {/* Player's bet chips */}
                      {!isFolded && player.currentBet > 0 && (
                        <PlayerBetChips
                          betAmount={player.currentBet}
                          startingChips={gameState.settings?.startingChips || 1000}
                          chipType={player.chipType || 'red'}
                        />
                      )}
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

          {/* Game status message - Only show for errors */}
          {lastAction?.type === 'error' && (
            <div className="game-status-bar">
              <div className="status-info">
                <div className="status-item error-message">
                  {lastAction.message}
                </div>
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
              const isWinner = lastAction?.type === 'showdown' && lastAction.winners.some(w => w.id === p.id);

              return (
                <div key={i} className={`sidebar-player-item ${isTurn ? 'active' : ''} ${p.folded ? 'folded' : ''} ${isWinner ? 'winner-glow' : ''}`}>
                  <div className="player-row-main">
                    {isTurn && <span className="turn-indicator">▶</span>}
                    <span className="player-name">{p.name}</span>
                    <span className="player-chips">${p.chips}</span>
                  </div>
                  <div className="player-row-secondary">
                    <span className="player-account">Bank: ${p.accountBalance || 0}</span>
                  </div>
                  <div className="player-row-badges">
                    {isDealer && <span className="badge dealer">D</span>}
                    {isSB && <span className="badge sb">SB</span>}
                    {isBB && <span className="badge bb">BB</span>}
                    {isWinner && <span className="badge winner">WIN</span>}
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
