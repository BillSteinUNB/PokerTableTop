import React from 'react';
import './GameTable.css';

/**
 * Game Table Component
 * Main poker table layout with classic arcade styling
 *
 * @param {React.ReactNode} children - Child components (dealer area, player areas, etc.)
 */
const GameTable = ({ children }) => {
  return (
    <div className="game-container">
      {/* Arcade-style border frame */}
      <div className="arcade-frame">
        <div className="frame-corner frame-corner-tl"></div>
        <div className="frame-corner frame-corner-tr"></div>
        <div className="frame-corner frame-corner-bl"></div>
        <div className="frame-corner frame-corner-br"></div>

        {/* Game table surface */}
        <div className="poker-table">
          {/* Table felt surface */}
          <div className="table-felt">
            {/* Table edge/rail */}
            <div className="table-rail"></div>

            {/* Playing surface */}
            <div className="playing-surface">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Pixel art decorative elements */}
      <div className="table-decorations">
        <div className="decoration-chip decoration-chip-left"></div>
        <div className="decoration-chip decoration-chip-right"></div>
      </div>
    </div>
  );
};

export default GameTable;
