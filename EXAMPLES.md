# 📚 Component Usage Examples

This document provides detailed examples of how to use each component in the Pixel Poker game.

## Table of Contents
- [Card Component](#card-component)
- [Chip Component](#chip-component)
- [GameTable Component](#gametable-component)
- [PlayerArea Component](#playerarea-component)
- [DealerArea Component](#dealerarea-component)
- [Controls Component](#controls-component)
- [Full Game Example](#full-game-example)

---

## Card Component

### Basic Usage

```jsx
import Card from './components/Card/Card';

function MyComponent() {
  return (
    <div>
      {/* Face-up Ace of Hearts */}
      <Card suit="hearts" rank="A" />

      {/* Face-up King of Spades, scaled larger */}
      <Card suit="spades" rank="K" scale={1.5} />

      {/* Face-down card */}
      <Card faceDown />
    </div>
  );
}
```

### Interactive Cards

```jsx
import Card from './components/Card/Card';

function InteractiveCards() {
  const handleCardClick = (suit, rank) => {
    console.log(`Clicked: ${rank} of ${suit}`);
  };

  return (
    <div>
      <Card
        suit="diamonds"
        rank="Q"
        scale={1.2}
        onClick={() => handleCardClick('diamonds', 'Q')}
      />
    </div>
  );
}
```

### Player Hand Example

```jsx
import Card from './components/Card/Card';

function PlayerHand({ cards, onCardSelect }) {
  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      {cards.map((card, index) => (
        <Card
          key={index}
          suit={card.suit}
          rank={card.rank}
          scale={1.3}
          onClick={() => onCardSelect(card)}
        />
      ))}
    </div>
  );
}

// Usage:
const myCards = [
  { suit: 'hearts', rank: 'A' },
  { suit: 'spades', rank: 'K' }
];

<PlayerHand cards={myCards} onCardSelect={(card) => console.log(card)} />
```

### All Card Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| suit | string | - | 'hearts', 'diamonds', 'clubs', 'spades' |
| rank | string | - | 'A', '2'-'10', 'J', 'Q', 'K' |
| faceDown | boolean | false | Show card back instead of face |
| scale | number | 1 | Size multiplier (1 = normal, 2 = double) |
| onClick | function | - | Click handler function |

---

## Chip Component

### Basic Usage

```jsx
import Chip from './components/Chip/Chip';

function MyComponent() {
  return (
    <div>
      {/* $1 chip */}
      <Chip value={1} />

      {/* $100 chip, scaled larger */}
      <Chip value={100} scale={2} />

      {/* Stack of 5 $25 chips */}
      <Chip value={25} count={5} />
    </div>
  );
}
```

### Chip Stack Display

```jsx
import Chip from './components/Chip/Chip';

function ChipStack({ amount }) {
  // Break down amount into chip denominations
  const getChips = (total) => {
    const chips = [];
    const denoms = [100, 25, 10, 5, 1];

    denoms.forEach(denom => {
      const count = Math.floor(total / denom);
      if (count > 0) {
        chips.push({ value: denom, count });
        total %= denom;
      }
    });

    return chips;
  };

  const chips = getChips(amount);

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {chips.map((chip, index) => (
        <Chip
          key={index}
          value={chip.value}
          count={chip.count}
          scale={1.5}
        />
      ))}
    </div>
  );
}

// Usage:
<ChipStack amount={267} /> // Shows: 2x$100, 2x$25, 1x$10, 1x$5, 2x$1
```

### All Chip Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| value | number | 1 | Chip denomination (1, 5, 10, 25, 100) |
| count | number | - | Number of chips (shows badge) |
| scale | number | 1 | Size multiplier |

---

## GameTable Component

### Basic Usage

```jsx
import GameTable from './components/GameTable/GameTable';

function App() {
  return (
    <GameTable>
      <h1>Your Game Content Here</h1>
      {/* Add dealer area, player areas, controls, etc. */}
    </GameTable>
  );
}
```

### Full Table Setup

```jsx
import GameTable from './components/GameTable/GameTable';
import DealerArea from './components/DealerArea/DealerArea';
import PlayerArea from './components/PlayerArea/PlayerArea';
import Controls from './components/Controls/Controls';

function PokerGame() {
  return (
    <GameTable>
      <div className="game-header">
        <h1>Texas Hold'em</h1>
      </div>

      <DealerArea />

      <div className="players">
        <PlayerArea playerName="Player 1" chipCount={1500} isActive />
        <PlayerArea playerName="Player 2" chipCount={2000} />
      </div>

      <Controls />
    </GameTable>
  );
}
```

---

## PlayerArea Component

### Basic Usage

```jsx
import PlayerArea from './components/PlayerArea/PlayerArea';

function Game() {
  return (
    <PlayerArea
      playerName="John Doe"
      chipCount={1500}
      currentBet={100}
      isActive={true}
    />
  );
}
```

### Multiple Players

```jsx
import PlayerArea from './components/PlayerArea/PlayerArea';

function MultiPlayerGame() {
  const players = [
    { name: 'Alice', chips: 2000, bet: 50, active: true },
    { name: 'Bob', chips: 1500, bet: 50, active: false },
    { name: 'Charlie', chips: 3000, bet: 100, active: false }
  ];

  return (
    <div className="players-grid">
      {players.map((player, index) => (
        <PlayerArea
          key={index}
          playerName={player.name}
          chipCount={player.chips}
          currentBet={player.bet}
          isActive={player.active}
        />
      ))}
    </div>
  );
}
```

### All PlayerArea Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| playerName | string | 'Player 1' | Display name |
| chipCount | number | 1000 | Total chips/money |
| currentBet | number | 0 | Current bet amount |
| isActive | boolean | false | Player's turn indicator |

---

## DealerArea Component

### Basic Usage

```jsx
import DealerArea from './components/DealerArea/DealerArea';

function Game() {
  return <DealerArea />;
}
```

The DealerArea component currently displays:
- Dealer label
- Community cards (5 cards for Texas Hold'em)
- Pot display

To customize, modify `src/components/DealerArea/DealerArea.jsx`

---

## Controls Component

### Basic Usage

```jsx
import Controls from './components/Controls/Controls';

function Game() {
  return <Controls />;
}
```

### Custom Action Handlers

Modify `src/components/Controls/Controls.jsx` to add your game logic:

```jsx
const Controls = ({ onFold, onCheck, onCall, onRaise, onAllIn }) => {
  const [betAmount, setBetAmount] = useState(0);

  const handleAction = (action) => {
    switch(action) {
      case 'fold':
        onFold();
        break;
      case 'check':
        onCheck();
        break;
      case 'call':
        onCall();
        break;
      case 'raise':
        onRaise(betAmount);
        break;
      case 'all-in':
        onAllIn();
        break;
    }
  };

  // ... rest of component
};
```

---

## Full Game Example

### Complete Poker Game Setup

```jsx
import React, { useState } from 'react';
import GameTable from './components/GameTable/GameTable';
import DealerArea from './components/DealerArea/DealerArea';
import PlayerArea from './components/PlayerArea/PlayerArea';
import Controls from './components/Controls/Controls';
import Card from './components/Card/Card';
import './App.css';

function PokerGame() {
  const [gameState, setGameState] = useState({
    pot: 500,
    currentPlayer: 0,
    players: [
      {
        name: 'Player 1',
        chips: 1500,
        currentBet: 100,
        hand: [
          { suit: 'hearts', rank: 'A' },
          { suit: 'spades', rank: 'K' }
        ]
      },
      {
        name: 'Player 2',
        chips: 2000,
        currentBet: 100,
        hand: [
          { suit: 'diamonds', rank: 'Q' },
          { suit: 'clubs', rank: 'J' }
        ]
      }
    ],
    communityCards: [
      { suit: 'hearts', rank: '10' },
      { suit: 'diamonds', rank: '9' },
      { suit: 'clubs', rank: '8' },
      { suit: null, rank: null, faceDown: true },
      { suit: null, rank: null, faceDown: true }
    ]
  });

  const handlePlayerAction = (action, amount) => {
    console.log(`Player action: ${action}`, amount);
    // Implement your game logic here
  };

  return (
    <GameTable>
      {/* Game Header */}
      <div className="game-header">
        <h1 className="game-title">
          <span className="title-pixel">♦</span>
          TEXAS HOLD'EM
          <span className="title-pixel">♦</span>
        </h1>
      </div>

      {/* Dealer Area with Community Cards */}
      <div className="dealer-section">
        <div className="dealer-label">DEALER</div>
        <div className="community-cards">
          {gameState.communityCards.map((card, index) => (
            <Card
              key={index}
              suit={card.suit}
              rank={card.rank}
              faceDown={card.faceDown}
              scale={1.2}
            />
          ))}
        </div>
        <div className="pot-display">
          <span>POT: ${gameState.pot}</span>
        </div>
      </div>

      {/* Players */}
      <div className="players-area">
        {gameState.players.map((player, index) => (
          <div key={index} className="player-section">
            <PlayerArea
              playerName={player.name}
              chipCount={player.chips}
              currentBet={player.currentBet}
              isActive={index === gameState.currentPlayer}
            />
            {/* Show player's hand */}
            <div className="player-hand">
              {player.hand.map((card, cardIndex) => (
                <Card
                  key={cardIndex}
                  suit={card.suit}
                  rank={card.rank}
                  scale={1.5}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <Controls onAction={handlePlayerAction} />

      {/* Status Message */}
      <div className="status-message">
        <p>Player {gameState.currentPlayer + 1}'s turn</p>
      </div>
    </GameTable>
  );
}

export default PokerGame;
```

---

## Styling Examples

### Custom Card Animations

Add to your CSS:

```css
.dealing-animation {
  animation: deal-card 0.5s ease-out;
}

@keyframes deal-card {
  0% {
    transform: translateX(-200px) rotate(-45deg);
    opacity: 0;
  }
  100% {
    transform: translateX(0) rotate(0deg);
    opacity: 1;
  }
}
```

Use in component:

```jsx
<Card
  suit="hearts"
  rank="A"
  className="dealing-animation"
/>
```

### Custom Theme Colors

Override CSS variables in your component:

```jsx
function CustomThemedGame() {
  return (
    <div style={{
      '--color-felt-green': '#1a472a',
      '--color-accent-gold': '#ffaa00'
    }}>
      <GameTable>
        {/* Your game content */}
      </GameTable>
    </div>
  );
}
```

---

## Advanced: State Management Example

### Using Context for Game State

```jsx
// GameContext.jsx
import React, { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState({
    pot: 0,
    currentPlayer: 0,
    players: [],
    communityCards: []
  });

  const placeBet = (playerId, amount) => {
    setGameState(prev => ({
      ...prev,
      pot: prev.pot + amount,
      players: prev.players.map((p, i) =>
        i === playerId ? { ...p, chips: p.chips - amount } : p
      )
    }));
  };

  return (
    <GameContext.Provider value={{ gameState, placeBet }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
```

```jsx
// Use in components
import { useGame } from './GameContext';

function PlayerComponent() {
  const { gameState, placeBet } = useGame();

  return (
    <PlayerArea
      playerName={gameState.players[0].name}
      chipCount={gameState.players[0].chips}
    />
  );
}
```

---

## Next Steps

1. Implement actual game logic
2. Add sound effects
3. Create animations
4. Add multiplayer support
5. Implement different poker variants

Check the main README.md for more information!
