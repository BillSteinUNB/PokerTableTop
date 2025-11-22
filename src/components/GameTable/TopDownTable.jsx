import React from 'react';
import { useGame } from '../../context/GameContext';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';
import Card from '../Card/Card';
import './TopDownTable.css';

/**
 * Top-Down Table Component
 * Bird's eye view of poker table with players positioned around it
 */
const TopDownTable = () => {
  const { gameState, playerData } = useGame();

  // Position players around the table (8 positions max)
  const getPlayerPosition = (index, totalPlayers) => {
    const positions = [
      { class: 'position-bottom', rotation: 0 },      // Position 0 (current player)
      { class: 'position-left', rotation: 90 },       // Position 1
      { class: 'position-top-left', rotation: 135 },  // Position 2
      { class: 'position-top', rotation: 180 },       // Position 3
      { class: 'position-top-right', rotation: 225 }, // Position 4
      { class: 'position-right', rotation: 270 },     // Position 5
      { class: 'position-bottom-right', rotation: 315 }, // Position 6
      { class: 'position-bottom-left', rotation: 45 } // Position 7
    ];

    return positions[index] || positions[0];
  };

  const players = gameState.players || [];
  const communityCards = gameState.communityCards || [];
  const pot = gameState.pot || 0;

  return (
    <div className="top-down-table">
      <div className="table-view">
        {/* Poker table surface */}
        <div className="poker-table-top">
          {/* Table felt */}
          <div className="table-felt-top">
            {/* Community cards in center */}
            <div className="community-cards-center">
              <div className="pot-display-center">
                <div className="pot-label">POT</div>
                <div className="pot-amount">${pot}</div>
              </div>

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

              return (
                <div
                  key={index}
                  className={`player-seat ${position.class} ${isCurrentPlayer ? 'current-player' : ''} ${
                    gameState.currentPlayerIndex === index ? 'active-turn' : ''
                  }`}
                >
                  {/* Player info */}
                  <div className="seat-player-info">
                    <PlayerAvatar
                      avatarId={player.avatar}
                      name={player.name}
                      scale={1}
                      showName={true}
                    />
                    <div className="player-chips-display">
                      💰 ${player.chips}
                    </div>
                  </div>

                  {/* Player's cards */}
                  <div className="seat-cards">
                    {isCurrentPlayer && player.hand ? (
                      // Show current player's cards face up
                      player.hand.map((card, cardIndex) => (
                        <Card
                          key={cardIndex}
                          suit={card.suit}
                          rank={card.rank}
                          scale={0.7}
                        />
                      ))
                    ) : (
                      // Show other players' cards face down
                      <>
                        <Card faceDown scale={0.7} />
                        <Card faceDown scale={0.7} />
                      </>
                    )}
                  </div>

                  {/* Current bet */}
                  {player.currentBet > 0 && (
                    <div className="player-bet">
                      <div className="bet-chip">💰</div>
                      <div className="bet-value">${player.currentBet}</div>
                    </div>
                  )}

                  {/* Active turn indicator */}
                  {gameState.currentPlayerIndex === index && (
                    <div className="turn-arrow">▼</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Game status message */}
        <div className="game-status-bar">
          <div className="status-text">
            {gameState.currentPlayerIndex !== undefined && players[gameState.currentPlayerIndex]
              ? `${players[gameState.currentPlayerIndex].name}'s turn`
              : 'Waiting for game to start...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopDownTable;
