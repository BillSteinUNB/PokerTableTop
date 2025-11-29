import React, { useState, useEffect } from 'react';
import Card from '../Card/Card';
import './ShowdownReveal.css';

/**
 * ShowdownReveal Component
 * Displays dramatic card-by-card reveal at showdown
 */
const ShowdownReveal = ({ gameState, onComplete }) => {
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [revealedPlayers, setRevealedPlayers] = useState(new Set());

  // Get reveal order (betting order from last aggressor)
  const getRevealOrder = () => {
    const { players, revealOrder } = gameState;

    if (revealOrder && revealOrder.length > 0) {
      // Use server-provided reveal order
      return revealOrder.map(idx => players[idx]).filter(p => p && !p.folded);
    }

    // Fallback: reveal active players in order
    return players.filter(p => !p.folded);
  };

  const playersToReveal = getRevealOrder();

  useEffect(() => {
    if (currentRevealIndex >= playersToReveal.length) {
      // All cards revealed, wait 2 seconds then complete
      const timer = setTimeout(() => {
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Reveal next player after delay
    const timer = setTimeout(() => {
      setRevealedPlayers(prev => new Set([...prev, currentRevealIndex]));
      setCurrentRevealIndex(prev => prev + 1);
    }, 1200); // 1.2 seconds between reveals

    return () => clearTimeout(timer);
  }, [currentRevealIndex, playersToReveal.length, onComplete]);

  // Get hand description for a player
  const getHandDescription = (player) => {
    if (!gameState.handDescriptions) return '';
    const desc = gameState.handDescriptions.find(h => h.playerId === player.id);
    return desc ? desc.description : '';
  };

  // Check if player is a winner
  const isWinner = (player) => {
    return gameState.lastAction?.winners?.some(w => w.id === player.id);
  };

  return (
    <div className="showdown-reveal-overlay">
      <div className="showdown-reveal-container">
        <div className="showdown-title">
          <span className="showdown-icon">🎰</span>
          SHOWDOWN
          <span className="showdown-icon">🎰</span>
        </div>

        <div className="community-cards-display">
          <div className="community-label">Community Cards</div>
          <div className="community-cards-row">
            {gameState.communityCards.map((card, idx) => (
              <Card
                key={idx}
                suit={card.suit}
                rank={card.rank}
                scale={1.2}
              />
            ))}
          </div>
        </div>

        <div className="players-reveal-grid">
          {playersToReveal.map((player, index) => {
            const isRevealed = revealedPlayers.has(index);
            const isCurrent = index === currentRevealIndex;
            const winner = isWinner(player);

            return (
              <div
                key={player.id}
                className={`player-reveal-card ${isRevealed ? 'revealed' : ''} ${isCurrent ? 'revealing' : ''} ${winner ? 'winner' : ''}`}
              >
                <div className="player-reveal-header">
                  <div className="player-reveal-name">{player.name}</div>
                  {winner && <div className="winner-badge">🏆 WINNER</div>}
                </div>

                <div className="player-reveal-cards">
                  {player.hand && player.hand.length === 2 ? (
                    player.hand.map((card, cardIdx) => (
                      <div
                        key={cardIdx}
                        className={`reveal-card-wrapper ${isRevealed ? `flip-card-${cardIdx}` : ''}`}
                      >
                        <Card
                          suit={isRevealed ? card.suit : null}
                          rank={isRevealed ? card.rank : null}
                          faceDown={!isRevealed}
                          scale={1.5}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="folded-indicator">FOLDED</div>
                  )}
                </div>

                {isRevealed && (
                  <div className="hand-description">
                    {getHandDescription(player)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {currentRevealIndex >= playersToReveal.length && (
          <div className="showdown-result">
            <div className="pot-won-display">
              <div className="pot-label">POT</div>
              <div className="pot-amount">${gameState.lastAction?.potWon || gameState.pot || 0}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowdownReveal;
