import React from 'react';
import Chip from '../Chip/Chip';
import './PlayerBetChips.css';

/**
 * PlayerBetChips Component
 * Displays a player's current bet as a chip stack with dollar amount
 * 
 * @param {number} betAmount - Current bet amount
 * @param {number} startingChips - Starting chip count for scaling
 * @param {string} chipType - Chip color/type
 */
const PlayerBetChips = ({ betAmount, startingChips, chipType }) => {
    if (!betAmount || betAmount === 0) return null;

    // Calculate stack height based on percentage of starting chips
    const percentage = (betAmount / startingChips) * 100;

    // Determine stack height: chip1 (smallest) to chip4 (tallest)
    let stackHeight = 1;
    if (percentage >= 100) {
        stackHeight = 4;  // 100%+ - tallest stack
    } else if (percentage >= 75) {
        stackHeight = 4;  // 75-99%
    } else if (percentage >= 50) {
        stackHeight = 3;  // 50-74%
    } else if (percentage >= 25) {
        stackHeight = 2;  // 25-49%
    } else {
        stackHeight = 1;  // <25% - shortest stack
    }

    return (
        <div className="player-bet-chips">
            <div className="bet-chip-stack">
                <Chip color={chipType} stackSize={stackHeight} />
            </div>
            <div className="bet-amount-label">
                ${betAmount}
            </div>
        </div>
    );
};

export default PlayerBetChips;
