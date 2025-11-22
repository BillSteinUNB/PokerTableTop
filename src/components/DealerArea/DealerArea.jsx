import React from 'react';
import Card from '../Card/Card';
import './DealerArea.css';

/**
 * Dealer Area Component
 * Shows dealer's cards and community cards (for games like Texas Hold'em)
 */
const DealerArea = () => {
  return (
    <div className="dealer-area">
      <div className="dealer-label">
        <span className="label-text">DEALER</span>
      </div>

      {/* Community Cards Section */}
      <div className="community-cards">
        <div className="community-cards-label">Community Cards</div>
        <div className="cards-container">
          {/* Example: 5 community cards - replace with actual game state */}
          <Card suit="hearts" rank="A" scale={1.2} />
          <Card suit="diamonds" rank="K" scale={1.2} />
          <Card suit="clubs" rank="Q" scale={1.2} />
          <Card faceDown scale={1.2} />
          <Card faceDown scale={1.2} />
        </div>
      </div>

      {/* Pot Display */}
      <div className="pot-display">
        <div className="pot-label">POT</div>
        <div className="pot-amount">$500</div>
      </div>
    </div>
  );
};

export default DealerArea;
