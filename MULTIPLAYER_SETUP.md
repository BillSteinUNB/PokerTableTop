# 🎮 Multiplayer Setup Guide

This guide will help you set up and run the **real-time multiplayer poker game** using WebSocket (Socket.io).

---

## 🚀 Quick Start

### **Option 1: Run Both Server & Client Together**

```bash
# Terminal 1: Start the backend server
cd server
npm start

# Terminal 2: Start the frontend
npm run dev
```

### **Option 2: Demo Mode (No Server Needed)**

If you just want to test the game locally without multiplayer:

```bash
npm run dev
# Then click "Create Lobby" → "🎮 DEMO MODE"
```

---

## 📋 Prerequisites

- **Node.js** v18+ installed
- **npm** or **yarn** package manager
- Two or more browser windows/tabs for testing multiplayer

---

## 🛠️ Installation

### **1. Install Client Dependencies**

```bash
npm install
```

### **2. Install Server Dependencies**

```bash
cd server
npm install
cd ..
```

---

## 🎯 Running Multiplayer

### **Step 1: Start the Backend Server**

```bash
cd server
npm start
```

You should see:
```
🎮 Poker Server Running on port 3001
📡 WebSocket server ready for connections
```

**The server runs on `http://localhost:3001`**

### **Step 2: Start the Frontend (in a new terminal)**

```bash
npm run dev
```

You should see:
```
VITE v5.4.21  ready in 300 ms
➜  Local:   http://localhost:3000/
```

**The client runs on `http://localhost:3000`**

### **Step 3: Test Multiplayer**

1. **Open first browser tab:**
   - Go to `http://localhost:3000`
   - Click **"Create Lobby"**
   - Enter your name, select avatar, etc.
   - Click **"Continue"** (this will create a multiplayer lobby)
   - You'll see a **6-digit lobby code** (e.g., `AB12CD`)

2. **Open second browser tab (or different browser):**
   - Go to `http://localhost:3000`
   - Click **"Join Game"**
   - Enter the lobby code from step 1
   - Enter your name, select avatar, etc.
   - Click **"Continue"**

3. **Start the game:**
   - In the **host's browser** (player who created lobby)
   - Click **"Start Game"**
   - Both players will see the poker table!

4. **Play poker:**
   - Players take turns making actions (fold, check, call, raise, all-in)
   - Game state syncs in real-time across all browsers
   - Complete hands, see winners, continue playing!

---

## 🏗️ Architecture

### **Backend (Server)**
- **Port:** 3001
- **Tech:** Express + Socket.io
- **Location:** `/server/`
- **Main File:** `server/index.js`

**Features:**
- Lobby creation and management
- Player matchmaking
- Server-authoritative game logic
- Real-time game state synchronization
- Reconnection handling

### **Frontend (Client)**
- **Port:** 3000
- **Tech:** React + Vite + Socket.io Client
- **Location:** `/src/`
- **Socket Service:** `src/services/socket.js`

**Features:**
- WebSocket connection to server
- Real-time lobby updates
- Real-time game state updates
- Multiplayer controls

---

## 🌐 Network Configuration

### **Playing on Local Network (LAN)**

To play with friends on the same network (e.g., WiFi):

1. **Find your local IP address:**
   ```bash
   # On Windows:
   ipconfig

   # On Mac/Linux:
   ifconfig
   # Look for your IP (e.g., 192.168.1.100)
   ```

2. **Update Socket service:**
   Edit `src/services/socket.js`:
   ```javascript
   const SERVER_URL = 'http://YOUR_IP_ADDRESS:3001';
   // Example: 'http://192.168.1.100:3001'
   ```

3. **Start server with host binding:**
   ```bash
   cd server
   node index.js
   ```

4. **Friends can access:**
   - Server: `http://YOUR_IP:3001`
   - Game: `http://YOUR_IP:3000`

---

## 🐛 Troubleshooting

### **Problem: "Cannot connect to server"**

**Solution:**
1. Make sure the server is running (`cd server && npm start`)
2. Check that port 3001 is not blocked by firewall
3. Verify server URL in `src/services/socket.js`

### **Problem: "Lobby not found"**

**Solution:**
1. Make sure you're using the correct 6-digit code
2. Lobby codes are case-insensitive
3. Server might have restarted (lobbies reset on restart)

### **Problem: "Connection timeout"**

**Solution:**
1. Check that both server and client are running
2. Clear browser cache and refresh
3. Check browser console for errors (F12)

### **Problem: Game state not updating**

**Solution:**
1. Check browser console for WebSocket errors
2. Refresh both browser windows
3. Restart the server

---

## 📊 Server Logs

The server shows helpful logs:

```
[8:30:45 PM] Player connected: xyz123
[8:30:46 PM] Lobby created: AB12CD by xyz123
[8:30:50 PM] Alice joined lobby: AB12CD
[8:30:55 PM] Game started in lobby: AB12CD
```

Use these to debug connection issues!

---

## 🎮 Game Modes

### **1. Multiplayer Mode (Default)**
- Real-time with WebSocket
- 2-8 players
- Players can join from different devices
- Requires server running

### **2. Demo Mode (Local Only)**
- No server needed
- 4 AI players (simulated)
- Perfect for testing UI/features
- Click "🎮 DEMO MODE" button

---

## 🔐 Security Notes

⚠️ **This is a development setup!** For production:

1. Use HTTPS/WSS instead of HTTP/WS
2. Add authentication
3. Validate all inputs on server
4. Rate limit connections
5. Use environment variables for config
6. Deploy server to cloud (Heroku, Railway, etc.)

---

## 📝 Next Steps

**To deploy for production:**

1. **Deploy server:**
   - Heroku, Railway, DigitalOcean, AWS
   - Set `PORT` environment variable
   - Use process manager (PM2)

2. **Deploy client:**
   - Vercel, Netlify, GitHub Pages
   - Update `SERVER_URL` in `socket.js`
   - Run `npm run build`

3. **Use a database:**
   - Redis for session storage
   - PostgreSQL for user data
   - Store game history

---

## ✅ Testing Checklist

- [ ] Server starts without errors
- [ ] Client connects to server
- [ ] Can create lobby
- [ ] Can join lobby with code
- [ ] Host can start game
- [ ] Game state syncs between players
- [ ] Can make actions (fold, check, call, raise)
- [ ] Showdown works correctly
- [ ] Next hand button works
- [ ] Disconnection is handled gracefully

---

## 🆘 Getting Help

If you run into issues:

1. Check server console for errors
2. Check browser console (F12) for errors
3. Make sure both server and client are running
4. Try demo mode first to verify game logic works

**Enjoy your multiplayer poker game!** 🎉
