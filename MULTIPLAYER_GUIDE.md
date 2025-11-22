# 🎮 Multiplayer Setup Guide

This guide explains how the multiplayer lobby system works and how to extend it with a real backend.

## 🎯 Current Implementation

The current version uses local state management with React Context. This is perfect for:
- Testing the UI flow
- Understanding the game structure
- Development and prototyping

**Note:** For real multiplayer, you'll need to add a backend (see below).

## 📱 Game Flow

### 1. Main Menu
- Players choose between **Join Game** or **Create Lobby**

### 2. Character Selection
- Enter name (2-12 characters)
- Choose avatar (8 different pixel art characters)
- Select card color (Classic, Red, Blue, Green, Purple)
- Choose chip style (Classic, Casino, Neon)

### 3. Lobby System

#### Creating a Lobby
1. Click "Create Lobby"
2. Customize character
3. System generates 6-digit lobby code
4. Wait for players to join
5. Host starts game when ready

#### Joining a Lobby
1. Click "Join Game"
2. Enter 6-digit lobby code
3. Customize character
4. Wait in lobby for host to start

### 4. Game Table
- Top-down view of poker table
- See your cards face-up
- See other players' cards face-down
- Player avatars positioned around table (up to 8 players)
- Community cards in center
- Pot display
- Turn indicators
- Action controls at bottom

## 🏗️ Architecture

### State Management (`src/context/GameContext.jsx`)

The game uses React Context to manage:

```javascript
{
  currentView: 'mainMenu', // Navigation state
  playerData: {
    name: '',
    avatar: 0,
    cardColor: 'classic',
    chipType: 'classic'
  },
  lobbyData: {
    code: '',
    isHost: false,
    players: [],
    settings: { ... }
  },
  gameState: {
    pot: 0,
    currentPlayerIndex: 0,
    communityCards: [],
    players: [],
    roundState: 'waiting'
  }
}
```

### Component Structure

```
App (with GameProvider)
├── MainMenu
├── JoinGame
├── CreateLobby
├── CharacterSelection
├── Lobby
└── Game View
    ├── TopDownTable
    │   └── PlayerAvatar (×8)
    └── Controls
```

## 🔌 Adding Real Multiplayer

To make this a true multiplayer game, you'll need to add a backend. Here are the recommended approaches:

### Option 1: WebSocket Server (Recommended)

**Tech Stack:**
- Backend: Node.js + Socket.io
- Database: Redis (for session storage)

**Implementation Steps:**

1. **Create Backend Server**

```javascript
// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const lobbies = new Map();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  // Create lobby
  socket.on('createLobby', (playerData) => {
    const code = generateCode();
    lobbies.set(code, {
      host: socket.id,
      players: [playerData],
      settings: { ... }
    });
    socket.join(code);
    socket.emit('lobbyCreated', { code });
  });

  // Join lobby
  socket.on('joinLobby', ({ code, playerData }) => {
    const lobby = lobbies.get(code);
    if (lobby && lobby.players.length < 8) {
      lobby.players.push(playerData);
      socket.join(code);
      io.to(code).emit('playerJoined', lobby);
    } else {
      socket.emit('joinError', 'Lobby full or not found');
    }
  });

  // Start game
  socket.on('startGame', (code) => {
    io.to(code).emit('gameStarted');
  });

  // Game actions
  socket.on('playerAction', ({ code, action, amount }) => {
    io.to(code).emit('gameUpdate', { action, amount });
  });

  socket.on('disconnect', () => {
    // Handle player disconnect
  });
});

server.listen(3001);
```

2. **Update Frontend to Use Socket.io**

```javascript
// src/services/socket.js
import io from 'socket.io-client';

const socket = io('http://localhost:3001');

export const createLobby = (playerData) => {
  return new Promise((resolve) => {
    socket.emit('createLobby', playerData);
    socket.on('lobbyCreated', (data) => resolve(data.code));
  });
};

export const joinLobby = (code, playerData) => {
  socket.emit('joinLobby', { code, playerData });
};

// ... more socket functions
```

3. **Update GameContext to use socket functions**

```javascript
// In src/context/GameContext.jsx
import { createLobby as socketCreateLobby } from '../services/socket';

const createLobby = async () => {
  const code = await socketCreateLobby(playerData);
  setLobbyData({ ...lobbyData, code, isHost: true });
  return code;
};
```

### Option 2: Firebase Realtime Database

**Pros:**
- No server setup needed
- Built-in real-time sync
- Free tier available

**Implementation:**

1. **Setup Firebase**

```bash
npm install firebase
```

2. **Initialize Firebase**

```javascript
// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

const firebaseConfig = {
  // Your config here
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export const createLobby = (code, lobbyData) => {
  set(ref(database, `lobbies/${code}`), lobbyData);
};

export const subscribeToLobby = (code, callback) => {
  const lobbyRef = ref(database, `lobbies/${code}`);
  onValue(lobbyRef, (snapshot) => {
    callback(snapshot.val());
  });
};
```

### Option 3: Supabase (PostgreSQL + Realtime)

**Pros:**
- PostgreSQL database
- Real-time subscriptions
- Built-in authentication
- REST API

**Setup:**

```bash
npm install @supabase/supabase-js
```

```javascript
// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const createLobby = async (lobbyData) => {
  const { data } = await supabase
    .from('lobbies')
    .insert([lobbyData])
    .select();
  return data;
};

export const subscribeToLobby = (code, callback) => {
  supabase
    .channel(`lobby:${code}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'lobbies'
    }, callback)
    .subscribe();
};
```

## 🎲 Game Logic Implementation

The game currently has placeholder logic. To implement full poker mechanics:

### 1. **Deck Management**

```javascript
// src/utils/deck.js
const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const createDeck = () => {
  const deck = [];
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({ suit, rank });
    });
  });
  return shuffleDeck(deck);
};

export const shuffleDeck = (deck) => {
  return deck.sort(() => Math.random() - 0.5);
};

export const dealCards = (deck, numCards) => {
  return deck.splice(0, numCards);
};
```

### 2. **Hand Evaluation**

```javascript
// src/utils/handEvaluator.js
export const evaluateHand = (cards) => {
  // Implement poker hand ranking
  // Royal Flush, Straight Flush, Four of a Kind, etc.
  // Return { rank, description, highCard }
};

export const compareHands = (hand1, hand2) => {
  // Return 1 if hand1 wins, -1 if hand2 wins, 0 for tie
};
```

### 3. **Betting Round Logic**

```javascript
// src/utils/bettingRound.js
export const processBet = (gameState, playerId, action, amount) => {
  const newState = { ...gameState };

  switch(action) {
    case 'fold':
      newState.players[playerId].folded = true;
      break;
    case 'call':
      // Implement call logic
      break;
    case 'raise':
      // Implement raise logic
      break;
    // ... more actions
  }

  return advanceToNextPlayer(newState);
};
```

## 🔐 Security Considerations

When implementing multiplayer:

1. **Validate all inputs** on the server
2. **Don't trust the client** - game state should be authoritative on server
3. **Prevent cheating** - cards should only be revealed when appropriate
4. **Rate limiting** - prevent spam
5. **Authentication** - consider adding user accounts
6. **Lobby codes** - use cryptographically secure random generation

## 📊 Scaling Considerations

For production deployment:

- **Horizontal scaling**: Use Redis for session storage
- **Load balancing**: Distribute WebSocket connections
- **Database**: PostgreSQL for persistent data
- **CDN**: Serve static assets via CDN
- **Monitoring**: Add logging and error tracking

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
# Deploy dist/ folder to hosting service
```

**Recommended hosting:**
- Frontend: Vercel, Netlify, GitHub Pages
- Backend: Heroku, Railway, DigitalOcean, AWS
- Database: Supabase, Firebase, MongoDB Atlas

## 📝 Next Steps

1. Choose a backend solution (Socket.io, Firebase, or Supabase)
2. Implement real-time communication
3. Add poker game logic (hand evaluation, betting rounds)
4. Implement authentication (optional)
5. Add sound effects and animations
6. Test with multiple players
7. Deploy to production

## 🎯 Testing Multiplayer Locally

To test multiplayer on your local network:

1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Update Vite config:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 3000
  }
});
```

3. Other devices can access: `http://YOUR_IP:3000`

---

**Need help?** Check the main README.md or EXAMPLES.md for more information!
