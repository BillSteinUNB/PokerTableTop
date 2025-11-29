import React from 'react';
import { useGame } from '../../context/GameContextMultiplayer';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';
import './PostGameScreen.css';

/**
 * Post-Game Victory Screen
 * Shows the tournament winner and allows players to return to lobby
 */
const PostGameScreen = () => {
    const { gameOverData, returnToLobby } = useGame();

    if (!gameOverData) {
        return null;
    }

    const { winner, message } = gameOverData;

    const handleReturnToLobby = () => {
        returnToLobby();
    };

    return (
        <div className="post-game-screen">
            <div className="post-game-container">
                {/* Victory Banner */}
                <div className="victory-banner">
                    <h1 className="victory-title">🏆 GAME OVER 🏆</h1>
                    <p className="victory-message">{message}</p>
                </div>

                {/* Winner Display */}
                {winner && (
                    <div className="winner-display">
                        <div className="winner-spotlight">
                            <PlayerAvatar
                                avatarId={winner.avatar}
                                name={winner.name}
                                scale={4}
                                showName={false}
                            />
                        </div>
                        <h2 className="winner-name">{winner.name}</h2>
                        <div className="winner-chips">
                            <span className="chip-label">Final Chips:</span>
                            <span className="chip-value">${winner.chips}</span>
                        </div>
                    </div>
                )}

                {/* Return to Lobby Button */}
                <button className="return-lobby-btn" onClick={handleReturnToLobby}>
                    Return to Lobby
                </button>

                <p className="lobby-hint">
                    Ready up in the lobby to play another game!
                </p>
            </div>
        </div>
    );
};

export default PostGameScreen;
