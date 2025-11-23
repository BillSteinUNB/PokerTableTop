# Poker TableTop - Project Context for AI Assistant

## Project Overview
This is a **multiplayer Texas Hold'em poker game** built with React 18 + Vite on the frontend and Express + Socket.io on the backend. The game features:
- ✅ Complete WebSocket-based multiplayer system
- ✅ Full Texas Hold'em poker logic (all hand rankings, betting rounds, winner determination)
- ✅ Individual sprite image system with CSS fallbacks
- ✅ Hybrid mode supporting both multiplayer and local demo modes
- ✅ Lobby system with 6-digit join codes
- ✅ Character selection with customizable avatars, card backs, and chip colors

**Current State:** The game is fully functional and polished. All core features are implemented and working.

**Git Branch:** `claude/pixel-poker-game-013KNc5zvU58SrxbwNU2Nfys`

## Tech Stack
- **Frontend:** React 18, Vite, Socket.io-client, React Context API
- **Backend:** Node.js, Express, Socket.io
- **Game Logic:** Custom implementation (no external poker libraries)
- **Styling:** Pure CSS with component-scoped stylesheets

## Critical Design Decisions

### 1. Sprite System - Individual Images (NOT Sprite Sheets)
**IMPORTANT:** The project uses individual sliced sprite images, NOT sprite sheets with CSS background-position.

**Naming Convention:**
- **Cards:** `{rank}{Suit}.png` - Examples: `aceSpade.png`, `twoHeart.png`, `kingDiamond.png`, `tenClub.png`
- **Card Backs:** `{color}Back.png` - Examples: `redBack.png`, `blueBack.png`, `classicBack.png`
- **Chips:** `{color}Chip{arrangement}.png` - Examples: `blackChipOne.png`, `redChipThree.png`, `blueChipFive.png`
- **Characters:** `character{Number}.png` - Examples: `characterOne.png`, `characterTwo.png`, `characterEight.png`

**Image Path:** All sprites go in `public/sprites/` directory.

**Helper Functions in `src/utils/spriteConfig.js`:**
```javascript
getCardImagePath(suit, rank)      // Returns: "aceSpade.png"
getCardBackImagePath(style)       // Returns: "blueBack.png"
getChipImagePath(color, arrangement) // Returns: "blackChipOne.png"
getCharacterImagePath(characterId)   // Returns: "characterOne.png"
```

**Fallback System:** All components (Card, Chip, PlayerAvatar) automatically fall back to CSS/emoji rendering if sprite images are missing. The game works perfectly without any sprite files.

### 2. Multiplayer Architecture - Server-Authoritative

**Server (`server/index.js` + `server/gameEngine.js`):**
- Handles ALL game logic (prevents cheating)
- Manages lobbies, players, game state
- Validates all player actions server-side
- Broadcasts state updates to all clients

**Client (`src/services/socket.js`):**
- Socket.io client wrapper
- Provides clean API for all socket operations
- Methods: `createLobby()`, `joinLobby()`, `sendPlayerAction()`, etc.
- Listens for `gameStateUpdate` events

**Key Events:**
- `createLobby` → Creates new lobby, returns 6-digit code
- `joinLobby` → Join existing lobby with code
- `startGame` → Host starts the game
- `playerAction` → Send action (fold, check, call, raise)
- `gameStateUpdate` → Server broadcasts new game state to all clients
- `disconnect` / `reconnect` → Handle player disconnections

### 3. Hybrid Context - Single Source of Truth

**`src/context/GameContextMultiplayer.jsx`** - The ONLY context provider (replaces old GameContext.jsx)

**Modes:**
- **Multiplayer Mode** (`isMultiplayer: true`) - Uses WebSocket, server processes all actions
- **Local Demo Mode** (`isMultiplayer: false`) - Uses local game engine, no server needed

**Unified API:** Same functions work for both modes:
```javascript
const {
  gameState,           // Current game state
  handlePlayerAction,  // fold, check, call, raise (works in both modes)
  createLobby,         // Creates multiplayer lobby
  joinLobby,           // Joins lobby by code
  startGame,           // Starts the game
  isMultiplayer,       // Current mode
  lobbyData            // Lobby info (players, settings, code)
} = useGame();
```

**CRITICAL:** ALL components must import from `GameContextMultiplayer.jsx`, NOT `GameContext.jsx` (which was deleted).

## File Structure

```
PokerTableTop/
├── server/                          # Backend (port 3001)
│   ├── index.js                     # Socket.io server, lobby management
│   ├── gameEngine.js                # Server-side game logic wrapper
│   └── package.json                 # Server dependencies
│
├── src/
│   ├── context/
│   │   └── GameContextMultiplayer.jsx  # ✅ ONLY context (hybrid mode)
│   │
│   ├── services/
│   │   └── socket.js                # Socket.io client wrapper
│   │
│   ├── utils/
│   │   ├── spriteConfig.js          # Sprite path helpers
│   │   ├── deck.js                  # Deck creation, shuffling, dealing
│   │   ├── handEvaluator.js         # Hand rankings, winner determination
│   │   └── gameEngine.js            # Texas Hold'em game flow
│   │
│   ├── components/
│   │   ├── MainMenu/                # Landing page
│   │   ├── CharacterSelection/      # Avatar, name, card/chip selection
│   │   ├── CreateLobby/             # Lobby creation + demo mode button
│   │   ├── JoinGame/                # Join by code
│   │   ├── Lobby/                   # Pre-game lobby (shows players)
│   │   ├── GameTable/               # ✅ Main game table view
│   │   │   ├── TopDownTable.jsx     # Top-down poker table component
│   │   │   └── TopDownTable.css     # Table styling
│   │   ├── Controls/                # Action buttons (fold, check, call, raise)
│   │   ├── Card/                    # Card component
│   │   ├── Chip/                    # Chip component
│   │   └── PlayerAvatar/            # Player avatar component
│   │
│   ├── data/
│   │   └── gameData.js              # Constants (suits, ranks, avatars)
│   │
│   └── App.jsx                      # Router (wraps everything in GameProvider)
│
├── public/sprites/                  # ⚠️ Currently empty (sprites not added yet)
│   └── (aceSpade.png, characterOne.png, etc.)
│
├── SPRITE_NAMING_GUIDE.md           # Complete sprite naming reference
├── MULTIPLAYER_SETUP.md             # Multiplayer setup instructions
└── README.md                        # Main documentation
```

## Game Logic Implementation

### Core Files:

**`src/utils/deck.js`**
- `createDeck()` - Creates 52-card deck
- `shuffleDeck()` - Fisher-Yates shuffle algorithm
- `dealCards()` - Deals N cards from deck

**`src/utils/handEvaluator.js`**
- `evaluateHand(cards)` - Finds best 5-card hand from 7 cards (2 hole + 5 community)
- Hand rankings: Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, One Pair, High Card
- `compareHands()` - Determines winner with proper tiebreakers (kickers)
- `determineWinner()` - Handles multiple players, split pots

**`src/utils/gameEngine.js`**
- `initializeGame(players, settings)` - Sets up new game
- `startNewHand(gameState)` - Starts new hand (shuffles, deals, posts blinds)
- `processPlayerAction(gameState, action, amount)` - Processes fold/check/call/raise
- Betting rounds: pre-flop → flop → turn → river → showdown
- Auto-advances when betting round complete

### Game State Structure:
```javascript
{
  players: [
    {
      id: "player-1",
      name: "Alice",
      chips: 1000,
      hand: [{suit: "hearts", rank: "A"}, {suit: "spades", rank: "K"}],
      currentBet: 0,
      folded: false,
      allIn: false,
      avatar: 0,
      cardColor: "blue",
      chipType: "black"
    }
  ],
  communityCards: [],
  pot: 0,
  currentBet: 0,
  currentPlayerIndex: 0,
  dealerPosition: 0,
  smallBlindPosition: 1,
  bigBlindPosition: 2,
  roundState: "pre-flop", // "flop", "turn", "river", "showdown"
  deck: [...],
  settings: { smallBlind: 5, bigBlind: 10, startingChips: 1000 }
}
```

## Important Patterns & Gotchas

### ✅ DO:
1. **Always import from `GameContextMultiplayer.jsx`** (never `GameContext.jsx`)
2. **Use sprite helper functions** from `spriteConfig.js` for all sprite paths
3. **Handle both multiplayer and local modes** - check `isMultiplayer` flag
4. **Test without sprites** - fallback rendering should always work
5. **Validate actions server-side** when adding new game features
6. **Use real server data** in Lobby component: `lobbyData.players`

### ❌ DON'T:
1. **Don't use sprite sheets** - we use individual images only
2. **Don't bypass server validation** - always send actions through `socketService.sendPlayerAction()`
3. **Don't hardcode sprite paths** - always use helper functions
4. **Don't create new context providers** - `GameContextMultiplayer.jsx` is the only one
5. **Don't use mock data** - components should use real game state
6. **Don't over-engineer** - keep solutions simple and focused

## Running the Project

### Multiplayer Mode (Full Experience):
```bash
# Terminal 1 - Backend
cd server
npm install  # First time only
npm start    # Runs on port 3001

# Terminal 2 - Frontend
npm install  # First time only
npm run dev  # Runs on port 5173

# Open http://localhost:5173 in multiple browser windows
```

### Demo Mode (Quick Testing):
```bash
# Only need frontend
npm run dev

# Click "🎮 DEMO MODE" button on Create Lobby screen
# Plays locally with 4 simulated players (no server needed)
```

### Testing Multiplayer:
1. Open browser window 1 → Create lobby → Get 6-digit code
2. Open browser window 2 → Join game → Enter code
3. Window 1 (host) → Start game
4. Both players can now play poker together

## Common Tasks

### Adding a New Feature:
1. **Read relevant files first** - Never propose changes without reading the code
2. **Plan with TodoWrite** - Break down complex tasks into steps
3. **Decide scope:**
   - Local only? → Update `gameEngine.js` and context's local mode
   - Multiplayer? → Update both `server/gameEngine.js` AND `src/utils/gameEngine.js`
4. **Test both modes** - Ensure feature works in multiplayer AND demo mode
5. **Keep it simple** - Don't add features beyond what's requested

### Adding New Sprites:
1. Create image following naming convention (e.g., `aceSpade.png`)
2. Place in `public/sprites/` directory
3. No code changes needed - helper functions handle the paths
4. Test fallback still works by temporarily removing the sprite

### Fixing Multiplayer Issues:
1. Check server console (`cd server && npm start`) for errors
2. Check browser console (F12) for client errors
3. Verify socket connection: Look for "Connected to server" message
4. Check `server/index.js` for event handlers
5. Check `src/services/socket.js` for client-side socket logic

## What's NOT Implemented Yet (Future Features)

- Animations (card dealing, chip movements)
- Sound effects
- Hand history viewer
- Player statistics tracking
- Chat system
- Tournament mode
- Blinds increase over time
- Multiple simultaneous games
- Spectator mode
- Mobile responsive design improvements

## Key Documentation Files

- **`SPRITE_NAMING_GUIDE.md`** - Complete reference for all 105 sprite filenames
- **`MULTIPLAYER_SETUP.md`** - Detailed multiplayer setup, testing, LAN config, troubleshooting
- **`README.md`** - Main project documentation with quick start guide

## Git Workflow

**Current Branch:** `claude/pixel-poker-game-013KNc5zvU58SrxbwNU2Nfys`

**When Making Changes:**
```bash
# Make changes
git add -A
git commit -m "Descriptive message"
git push -u origin claude/pixel-poker-game-013KNc5zvU58SrxbwNU2Nfys
```

**CRITICAL:** Always push to the branch starting with `claude/` and ending with the session ID, otherwise push will fail with 403.

## Summary for New AI Assistant

You are joining a **fully functional multiplayer poker game project**. The core game is complete and polished. When asked to add new features:

1. **Read the relevant files first** before suggesting changes
2. **Understand the hybrid architecture** - code must work in both multiplayer and local modes
3. **Follow the sprite naming convention** - individual images, not sprite sheets
4. **Keep it simple** - only implement what's requested, don't over-engineer
5. **Test both modes** - multiplayer (with server) and demo mode (local)
6. **Use TodoWrite** for planning complex tasks

The codebase is clean, well-organized, and ready for new features. Start by exploring the structure and reading the key files mentioned above.
