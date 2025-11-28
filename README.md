# 🎰 Pixel Poker - Multiplayer Texas Hold'em

A **real-time multiplayer poker game** with pixel-art retro arcade aesthetics. Built with React, Socket.io, and complete Texas Hold'em game logic. Play with friends across devices!

## ✨ Features

### 🎮 Fully Functional Multiplayer
- **Real-time WebSocket gameplay** - Play across different browsers/devices
- **Lobby system** - Create/join games with 6-digit codes
- **2-8 players** - Support for multiple players per table
- **Server-authoritative** - Game logic runs on server (prevents cheating)

### 🃏 Complete Texas Hold'em Poker
- **All hand rankings** - Royal Flush → High Card
- **Proper game flow** - Pre-flop, flop, turn, river, showdown
- **All actions** - Fold, check, call, raise, all-in
- **Blinds & dealer button** - Small/big blind, rotating dealer
- **Winner determination** - Automatic hand evaluation and pot distribution

### 👤 Player Customization
- **8 pixel-art avatars** - Choose your character
- **5 card back styles** - Customize your cards
- **5 chip colors** - Pick your chip style

### 🎨 Retro Aesthetics
- **Pixel-art style** - Classic arcade look
- **Top-down table view** - See all players around the table
- **CSS fallback rendering** - Works without sprites
- **Responsive design** - Desktop, tablet, mobile

---

## 🚀 Quick Start

### **Option 1: Multiplayer Mode** (Real-time with friends)

**Terminal 1 - Start Backend Server:**
```bash
cd server
npm install  # Only needed first time
npm start
```

**Terminal 2 - Start Frontend:**
```bash
npm install  # Only needed first time
npm run dev
```

**Then:**
1. Open `http://localhost:3000` in multiple browser windows/tabs
2. First player: Click "Create Lobby" → Enter name/avatar → Get lobby code
3. Other players: Click "Join Game" → Enter lobby code
4. Host starts game when ready!

### **Option 2: Demo Mode** (Local, no server needed)

```bash
npm run dev
```

Then click **"Create Lobby" → "🎮 DEMO MODE"** to play instantly with 4 simulated players!

---

## 🎮 How to Play

### Creating a Game:
1. Click **"Create Lobby"**
2. Customize your character (name, avatar, card back, chips)
3. Share the **6-digit lobby code** with friends
4. Wait for players to join
5. Click **"Start Game"** when ready!

### Joining a Game:
1. Click **"Join Game"**
2. Enter your friend's **lobby code**
3. Customize your character
4. Wait in lobby for host to start

### Playing Poker:
- **Your cards** are shown face-up at the bottom
- **Other players' cards** are face-down
- **Action buttons** appear on your turn:
  - **FOLD** - Give up your hand
  - **CHECK** - Pass (if no bet to call)
  - **CALL** - Match the current bet
  - **RAISE** - Increase the bet
  - **ALL IN** - Bet all your chips
- Game progresses automatically through rounds
- Winner announced at showdown
- Click **"Next Hand"** to continue

---

## 📁 Project Structure

```
PokerTableTop/
├── server/                      # Backend WebSocket server
│   ├── index.js                 # Socket.io server (port 3001)
│   ├── gameEngine.js            # Server-side game logic
│   ├── utils/                   # Deck & hand evaluation
│   └── package.json
├── src/
│   ├── components/
│   │   ├── MainMenu/            # Main menu
│   │   ├── JoinGame/            # Join lobby screen
│   │   ├── CreateLobby/         # Create lobby + demo mode
│   │   ├── CharacterSelection/  # Player customization
│   │   ├── Lobby/               # Waiting room
│   │   ├── GameTable/
│   │   │   └── TopDownTable.jsx # Poker table view
│   │   ├── Controls/            # Action buttons
│   │   ├── Card/                # Playing card component
│   │   ├── Chip/                # Poker chip component
│   │   └── PlayerAvatar/        # Player avatar display
│   ├── context/
│   │   └── GameContextMultiplayer.jsx  # State management
│   ├── services/
│   │   └── socket.js            # WebSocket client
│   ├── utils/
│   │   ├── deck.js              # Deck management
│   │   ├── gameEngine.js        # Texas Hold'em logic
│   │   ├── handEvaluator.js     # Hand ranking system
│   │   └── spriteConfig.js      # Sprite configuration
│   └── data/
│       └── gameData.js          # Character/customization data
├── public/
│   └── assets/
│       └── sprites/             # Sprite images (optional)
│           ├── cards/           # Individual card images
│           ├── cardbacks/       # Card back images
│           ├── chips/           # Chip images
│           └── characters/      # Character avatars
├── MULTIPLAYER_SETUP.md         # Detailed multiplayer guide
├── SPRITE_NAMING_GUIDE.md       # Sprite image reference
└── README.md                    # This file
```

---

## 🖼️ Adding Sprites (Optional)

**The game works perfectly without sprites** using CSS fallback rendering. To add sprites:

1. **Create sprite directories:**
   ```bash
   mkdir -p public/assets/sprites/{cards,cardbacks,chips,characters}
   ```

2. **Add your images** following the naming convention in `SPRITE_NAMING_GUIDE.md`:
   - Cards: `aceSpade.png`, `twoHeart.png`, etc. (52 total)
   - Card backs: `classicBack.png`, `redBack.png`, etc. (5 total)
   - Chips: `blackChipOne.png`, `redChipThree.png`, etc. (40 total)
   - Characters: `Character1.png`, `Character2.png`, etc. (8 total)

3. **Refresh** - Sprites load automatically!

See `SPRITE_NAMING_GUIDE.md` for complete details.

---

## 🌐 Playing on Your Local Network

To play with friends on the same WiFi:

1. Find your local IP address:
   ```bash
   # Windows: ipconfig
   # Mac/Linux: ifconfig
   ```

2. Edit `src/services/socket.js` line 5:
   ```javascript
   const SERVER_URL = 'http://YOUR_IP:3001';
   // Example: 'http://192.168.1.100:3001'
   ```

3. Friends can connect to: `http://YOUR_IP:3000`

---

## 🎯 Implemented Features

### ✅ Complete
- ✅ Real-time multiplayer (WebSocket)
- ✅ Complete Texas Hold'em logic
- ✅ All hand rankings (Royal Flush → High Card)
- ✅ All betting actions (fold, check, call, raise, all-in)
- ✅ Blinds & dealer rotation
- ✅ Winner determination & pot distribution
- ✅ Lobby system (create/join)
- ✅ Player customization
- ✅ Top-down table view
- ✅ Server-side game validation
- ✅ Reconnection handling
- ✅ CSS fallback rendering
- ✅ Demo mode (local play)

### 📋 Future Enhancements
- 🔜 Animations (card dealing, chips moving)
- 🔜 Sound effects
- 🔜 Hand history viewer
- 🔜 Player statistics
- 🔜 Chat system
- 🔜 Tournament mode

---

## 🐛 Troubleshooting

**"Cannot connect to server"**
- Make sure server is running: `cd server && npm start`
- Check port 3001 isn't blocked

**"Lobby not found"**
- Server might have restarted (lobbies reset)
- Double-check the 6-digit code

**Demo mode not working?**
- Make sure you clicked "🎮 DEMO MODE" button
- Demo mode doesn't require server

---

## 📚 Documentation

- **MULTIPLAYER_SETUP.md** - Detailed multiplayer setup guide
- **SPRITE_NAMING_GUIDE.md** - Sprite image specifications
- **EXAMPLES.md** - Component usage examples

---

## 🚢 Production Deployment

### Deploy Server:
- Heroku, Railway, DigitalOcean, AWS
- Set PORT environment variable
- Use process manager (PM2)

### Deploy Client:
- Vercel, Netlify, GitHub Pages
- Update SERVER_URL in socket.js
- Run `npm run build`

See `MULTIPLAYER_SETUP.md` for deployment guide.

---

## 🤝 Contributing

Ideas for contributions:
- Additional poker variants (Omaha, 5-Card Draw)
- Custom table themes
- Enhanced animations
- Mobile touch optimizations
- Tournament mode

---

## 📄 License

Open source - available for educational and personal use.

---

**Happy Playing! 🎰♠️♥️♣️♦️**
