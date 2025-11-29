/**
 * Multiplayer Poker Server
 * WebSocket server using Socket.io for real-time poker game
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import { GameEngine } from './gameEngine.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);

// Configure allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.CLIENT_URL, // Production client URL
].filter(Boolean); // Remove undefined values

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store active lobbies and game engines
const lobbies = new Map();
const gameEngines = new Map();

// Store session tokens for reconnection authentication
const sessionTokens = new Map(); // playerId -> { token, lobbyCode, expiresAt }

// Rate limiting: track requests per socket
const rateLimits = new Map(); // socketId -> { count, resetAt }

/**
 * Generate a unique 6-character lobby code
 */
function generateLobbyCode() {
  let code;
  let attempts = 0;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
    attempts++;
    if (attempts > 1000) {
      throw new Error('Unable to generate unique lobby code');
    }
  } while (lobbies.has(code));
  return code;
}

/**
 * Generate a secure session token for reconnection
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Rate limiting check - allows 10 requests per second per socket
 */
function checkRateLimit(socketId) {
  const now = Date.now();
  const limit = rateLimits.get(socketId);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(socketId, { count: 1, resetAt: now + 1000 });
    return true;
  }

  if (limit.count >= 10) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Clean up expired session tokens
 */
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [playerId, session] of sessionTokens.entries()) {
    if (now > session.expiresAt) {
      sessionTokens.delete(playerId);
    }
  }
}

// Clean up expired tokens every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);

/**
 * Broadcast game state to all players in a lobby
 * SECURITY: Sends personalized state to each player (hides other players' hole cards)
 */
function broadcastGameState(lobbyCode) {
  const engine = gameEngines.get(lobbyCode);
  const lobby = lobbies.get(lobbyCode);

  if (!engine || !lobby) return;

  const gameState = engine.getGameState();

  // Send personalized game state to each player
  lobby.players.forEach(player => {
    const personalizedState = getPersonalizedGameState(gameState, player.socketId);
    io.to(player.socketId).emit('gameStateUpdate', personalizedState);
  });
}

/**
 * Get personalized game state for a specific player
 * Hides other players' hole cards unless it's showdown
 */
function getPersonalizedGameState(gameState, socketId) {
  const isShowdown = gameState.roundState === 'showdown' || gameState.roundState === 'hand-complete';

  return {
    ...gameState,
    players: gameState.players.map(player => {
      // Show cards only if: it's the player's own cards, OR it's showdown and player didn't fold
      const shouldShowCards = player.socketId === socketId || (isShowdown && !player.folded);

      return {
        ...player,
        hand: shouldShowCards ? player.hand : (player.hand && player.hand.length > 0 ? [{}, {}] : [])
      };
    })
  };
}

/**
 * Start action timeout for current player
 * Auto-folds if player doesn't act within 30 seconds
 */
function startActionTimeout(lobbyCode) {
  const lobby = lobbies.get(lobbyCode);
  const engine = gameEngines.get(lobbyCode);

  if (!lobby || !engine) return;

  // Clear any existing timeout
  if (lobby.actionTimeout) {
    clearTimeout(lobby.actionTimeout);
  }

  const gameState = engine.getGameState();

  // Don't set timeout for waiting/showdown states
  if (gameState.roundState === 'waiting' || gameState.roundState === 'showdown' || gameState.roundState === 'hand-complete') {
    return;
  }

  // Set 30-second timeout
  lobby.actionTimeout = setTimeout(() => {
    const currentState = engine.getGameState();
    const currentPlayer = currentState.players[currentState.currentPlayerIndex];

    console.log(`[${new Date().toLocaleTimeString()}] Action timeout for ${currentPlayer.name} in lobby ${lobbyCode}`);

    // Auto-fold the player
    try {
      engine.handlePlayerAction('fold', 0);
      broadcastGameState(lobbyCode);

      // Notify all players
      io.to(lobbyCode).emit('playerTimedOut', {
        playerName: currentPlayer.name,
        playerIndex: currentState.currentPlayerIndex
      });

      // Check if game continues and start next timeout
      const newState = engine.getGameState();
      if (newState.roundState !== 'showdown' && newState.roundState !== 'hand-complete') {
        startActionTimeout(lobbyCode);
      }
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] Error auto-folding player:`, error);
    }
  }, 30000); // 30 seconds
}

/**
 * Broadcast lobby state to all players in a lobby
 */
function broadcastLobbyState(lobbyCode) {
  const lobby = lobbies.get(lobbyCode);
  if (lobby) {
    io.to(lobbyCode).emit('lobbyUpdate', {
      players: lobby.players,
      settings: lobby.settings,
      code: lobbyCode,
      hostId: lobby.hostId
    });
  }
}

io.on('connection', (socket) => {
  console.log(`[${new Date().toLocaleTimeString()}] Player connected: ${socket.id}`);

  // Middleware: Rate limiting on all socket events
  socket.use((packet, next) => {
    if (!checkRateLimit(socket.id)) {
      console.log(`[${new Date().toLocaleTimeString()}] Rate limit exceeded for ${socket.id}`);
      next(new Error('Rate limit exceeded. Please slow down.'));
      return;
    }
    next();
  });

  /**
   * Create a new lobby
   */
  socket.on('createLobby', (playerData, callback) => {
    try {
      // Validate and sanitize player data
      if (!playerData || typeof playerData.name !== 'string' || !playerData.name.trim()) {
        callback({ success: false, error: 'Invalid player data' });
        return;
      }

      // Sanitize player name (2-20 alphanumeric characters plus spaces)
      const sanitizedName = playerData.name.trim().substring(0, 20);
      if (sanitizedName.length < 2) {
        callback({ success: false, error: 'Name must be at least 2 characters' });
        return;
      }

      const lobbyCode = generateLobbyCode();

      const playerId = socket.id;
      const sessionToken = generateSessionToken();

      // Store session token (expires in 1 hour)
      sessionTokens.set(playerId, {
        token: sessionToken,
        lobbyCode: lobbyCode,
        expiresAt: Date.now() + 60 * 60 * 1000
      });

      const lobby = {
        code: lobbyCode,
        hostId: socket.id,
        players: [{
          ...playerData,
          name: sanitizedName,
          id: playerId,
          socketId: socket.id,
          sessionToken: sessionToken
        }],
        settings: {
          smallBlind: 5,
          bigBlind: 10,
          startingChips: 1000,
          minPlayers: 2,
          maxPlayers: 8
        },
        gameStarted: false,
        actionTimeout: null
      };

      lobbies.set(lobbyCode, lobby);
      socket.join(lobbyCode);
      socket.lobbyCode = lobbyCode;

      console.log(`[${new Date().toLocaleTimeString()}] Lobby created: ${lobbyCode} by ${sanitizedName} (${socket.id})`);

      callback({ success: true, lobbyCode, sessionToken });
      broadcastLobbyState(lobbyCode);
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] Error creating lobby:`, error);
      callback({ success: false, error: 'Failed to create lobby' });
    }
  });

  /**
   * Check if a lobby exists
   */
  socket.on('checkLobby', (lobbyCode, callback) => {
    const lobby = lobbies.get(lobbyCode);

    if (!lobby) {
      callback({ success: false, error: 'Lobby not found' });
      return;
    }

    if (lobby.gameStarted) {
      callback({ success: false, error: 'Game already in progress' });
      return;
    }

    if (lobby.players.length >= lobby.settings.maxPlayers) {
      callback({ success: false, error: 'Lobby is full' });
      return;
    }

    callback({ success: true });
  });

  /**
   * Join an existing lobby
   */
  socket.on('joinLobby', ({ lobbyCode, playerData }, callback) => {
    try {
      // Validate lobby code
      if (!lobbyCode || typeof lobbyCode !== 'string' || lobbyCode.length !== 6) {
        callback({ success: false, error: 'Invalid lobby code' });
        return;
      }

      // Validate and sanitize player data
      if (!playerData || typeof playerData.name !== 'string' || !playerData.name.trim()) {
        callback({ success: false, error: 'Invalid player data' });
        return;
      }

      // Sanitize player name (2-20 characters)
      const sanitizedName = playerData.name.trim().substring(0, 20);
      if (sanitizedName.length < 2) {
        callback({ success: false, error: 'Name must be at least 2 characters' });
        return;
      }

      const lobby = lobbies.get(lobbyCode.toUpperCase());

      if (!lobby) {
        callback({ success: false, error: 'Lobby not found' });
        return;
      }

      if (lobby.gameStarted) {
        callback({ success: false, error: 'Game already in progress' });
        return;
      }

      if (lobby.players.length >= lobby.settings.maxPlayers) {
        callback({ success: false, error: 'Lobby is full' });
        return;
      }

      // Check if player name is already taken
      if (lobby.players.some(p => p.name === sanitizedName)) {
        callback({ success: false, error: 'Name already taken' });
        return;
      }

      const playerId = socket.id;
      const sessionToken = generateSessionToken();

      // Store session token (expires in 1 hour)
      sessionTokens.set(playerId, {
        token: sessionToken,
        lobbyCode: lobbyCode,
        expiresAt: Date.now() + 60 * 60 * 1000
      });

      lobby.players.push({
        ...playerData,
        name: sanitizedName,
        id: playerId,
        socketId: socket.id,
        sessionToken: sessionToken
      });

      socket.join(lobbyCode);
      socket.lobbyCode = lobbyCode;

      console.log(`[${new Date().toLocaleTimeString()}] ${sanitizedName} (${socket.id}) joined lobby: ${lobbyCode}`);

      callback({ success: true, lobbyCode, sessionToken });
      broadcastLobbyState(lobbyCode);
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] Error joining lobby:`, error);
      callback({ success: false, error: 'Failed to join lobby' });
    }
  });

  /**
   * Leave lobby
   */
  socket.on('leaveLobby', () => {
    const lobbyCode = socket.lobbyCode;
    if (!lobbyCode) return;

    const lobby = lobbies.get(lobbyCode);
    if (!lobby) return;

    // Remove player from lobby
    lobby.players = lobby.players.filter(p => p.socketId !== socket.id);

    if (lobby.players.length === 0) {
      // Delete empty lobby
      lobbies.delete(lobbyCode);
      gameEngines.delete(lobbyCode);
      console.log(`[${new Date().toLocaleTimeString()}] Lobby ${lobbyCode} deleted (empty)`);
    } else {
      // If host left, assign new host
      if (lobby.hostId === socket.id) {
        lobby.hostId = lobby.players[0].socketId;
        console.log(`[${new Date().toLocaleTimeString()}] New host for ${lobbyCode}: ${lobby.hostId}`);
      }
      broadcastLobbyState(lobbyCode);
    }

    socket.leave(lobbyCode);
    socket.lobbyCode = null;
  });

  /**
   * Start game
   */
  socket.on('startGame', (callback) => {
    const lobbyCode = socket.lobbyCode;
    const lobby = lobbies.get(lobbyCode);

    if (!lobby) {
      callback({ success: false, error: 'Lobby not found' });
      return;
    }

    if (lobby.hostId !== socket.id) {
      callback({ success: false, error: 'Only host can start game' });
      return;
    }

    if (lobby.players.length < lobby.settings.minPlayers) {
      callback({ success: false, error: `Need at least ${lobby.settings.minPlayers} players` });
      return;
    }

    // Create game engine for this lobby
    const engine = new GameEngine(lobby.players, lobby.settings);
    gameEngines.set(lobbyCode, engine);
    lobby.gameStarted = true;

    console.log(`[${new Date().toLocaleTimeString()}] Game started in lobby: ${lobbyCode}`);

    // Notify all players game is starting
    io.to(lobbyCode).emit('gameStarted');

    callback({ success: true });
    broadcastGameState(lobbyCode);

    // Start action timeout for first player
    startActionTimeout(lobbyCode);
  });

  /**
   * Player action
   */
  socket.on('playerAction', ({ action, amount }, callback) => {
    const lobbyCode = socket.lobbyCode;
    const engine = gameEngines.get(lobbyCode);
    const lobby = lobbies.get(lobbyCode);

    if (!engine || !lobby) {
      callback({ success: false, error: 'Game not found' });
      return;
    }

    // Verify it's this player's turn
    const gameState = engine.getGameState();
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    if (currentPlayer.socketId !== socket.id) {
      callback({ success: false, error: 'Not your turn' });
      return;
    }

    // Validate action type
    if (!['fold', 'check', 'call', 'raise', 'all-in'].includes(action)) {
      callback({ success: false, error: 'Invalid action type' });
      return;
    }

    // Validate bet amounts for raise action
    if (action === 'raise') {
      // Type check and sanitization
      if (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0) {
        callback({ success: false, error: 'Invalid bet amount' });
        return;
      }

      // Check if amount is integer (no fractional chips)
      if (!Number.isInteger(amount)) {
        callback({ success: false, error: 'Bet amount must be a whole number' });
        return;
      }

      // Check minimum raise
      const minRaise = gameState.currentBet + (gameState.lastRaiseAmount || gameState.settings.bigBlind);
      if (amount < minRaise && amount !== currentPlayer.chips + currentPlayer.currentBet) {
        callback({ success: false, error: `Minimum raise is ${minRaise}` });
        return;
      }

      // Check maximum (can't bet more than you have)
      const maxBet = currentPlayer.chips + currentPlayer.currentBet;
      if (amount > maxBet) {
        callback({ success: false, error: 'Insufficient chips' });
        return;
      }

      // Must raise more than current bet
      if (amount <= gameState.currentBet) {
        callback({ success: false, error: 'Raise amount must be higher than current bet' });
        return;
      }
    }

    // Clear any pending timeout for this lobby
    if (lobby.actionTimeout) {
      clearTimeout(lobby.actionTimeout);
      lobby.actionTimeout = null;
    }

    try {
      engine.handlePlayerAction(action, amount || 0);
      callback({ success: true });
      broadcastGameState(lobbyCode);

      // If showdown, auto-advance after delay
      const newState = engine.getGameState();
      if (newState.roundState === 'showdown') {
        setTimeout(() => {
          engine.nextHand();
          broadcastGameState(lobbyCode);
        }, 5000);
      } else {
        // Start timeout for next player
        startActionTimeout(lobbyCode);
      }
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] Error processing action:`, error);
      callback({ success: false, error: error.message });
    }
  });

  /**
   * Next hand (manual trigger)
   */
  socket.on('nextHand', () => {
    const lobbyCode = socket.lobbyCode;
    const engine = gameEngines.get(lobbyCode);

    if (engine) {
      engine.nextHand();
      broadcastGameState(lobbyCode);
    }
  });

  /**
   * Force next hand (debug tool - host only)
   * Folds all remaining players and advances to next hand
   */
  socket.on('forceNextHand', (callback) => {
    const lobbyCode = socket.lobbyCode;
    const engine = gameEngines.get(lobbyCode);
    const lobby = lobbies.get(lobbyCode);

    if (!engine || !lobby) {
      callback({ success: false, error: 'Game not found' });
      return;
    }

    // Only host can force next hand
    if (lobby.hostId !== socket.id) {
      callback({ success: false, error: 'Only host can force next hand' });
      return;
    }

    console.log(`[${new Date().toLocaleTimeString()}] Host forcing next hand in lobby ${lobbyCode}`);

    try {
      const gameState = engine.getGameState();
      
      // Fold all players who haven't folded or gone all-in
      gameState.players.forEach((player, index) => {
        if (!player.folded && !player.allIn && player.chips > 0) {
          console.log(`[${new Date().toLocaleTimeString()}] Force folding ${player.name}`);
          // Set the current player to this player temporarily and fold them
          engine.currentPlayerIndex = index;
          try {
            engine.handlePlayerAction('fold', 0);
          } catch (error) {
            console.error(`[${new Date().toLocaleTimeString()}] Error force folding ${player.name}:`, error);
          }
        }
      });

      // Broadcast updated state
      broadcastGameState(lobbyCode);

      callback({ success: true });

      // Notify all players that host forced next hand
      io.to(lobbyCode).emit('hostForcedNextHand', {
        message: 'Host skipped to next hand'
      });
    } catch (error) {
      console.error(`[${new Date().toLocaleTimeString()}] Error forcing next hand:`, error);
      callback({ success: false, error: error.message });
    }
  });

  /**
   * Handle disconnection
   */
  socket.on('disconnect', () => {
    console.log(`[${new Date().toLocaleTimeString()}] Player disconnected: ${socket.id}`);

    const lobbyCode = socket.lobbyCode;
    if (!lobbyCode) return;

    const lobby = lobbies.get(lobbyCode);
    const engine = gameEngines.get(lobbyCode);
    if (!lobby) return;

    // Mark player as disconnected instead of removing immediately
    const player = lobby.players.find(p => p.socketId === socket.id);
    if (player) {
      player.disconnected = true;
      console.log(`[${new Date().toLocaleTimeString()}] ${player.name} disconnected from ${lobbyCode}`);

      // If game is active and it's this player's turn, auto-fold them
      if (lobby.gameStarted && engine) {
        const gameState = engine.getGameState();
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];

        if (currentPlayer && currentPlayer.socketId === socket.id) {
          console.log(`[${new Date().toLocaleTimeString()}] Auto-folding disconnected player ${player.name}`);

          // Clear any action timeout
          if (lobby.actionTimeout) {
            clearTimeout(lobby.actionTimeout);
            lobby.actionTimeout = null;
          }

          try {
            engine.handlePlayerAction('fold', 0);
            broadcastGameState(lobbyCode);

            // Notify all players
            io.to(lobbyCode).emit('playerDisconnected', {
              playerName: player.name,
              autoFolded: true
            });

            // Start timeout for next player
            const newState = engine.getGameState();
            if (newState.roundState !== 'showdown' && newState.roundState !== 'hand-complete') {
              startActionTimeout(lobbyCode);
            }
          } catch (error) {
            console.error(`[${new Date().toLocaleTimeString()}] Error auto-folding disconnected player:`, error);
          }
        }
      }

      // If game hasn't started, remove player after 30 seconds
      if (!lobby.gameStarted) {
        setTimeout(() => {
          const stillDisconnected = lobby.players.find(p => p.socketId === socket.id && p.disconnected);
          if (stillDisconnected) {
            lobby.players = lobby.players.filter(p => p.socketId !== socket.id);

            if (lobby.players.length === 0) {
              // Clean up session tokens for this lobby
              lobby.players.forEach(p => {
                sessionTokens.delete(p.id);
              });

              // Clear any timeouts
              if (lobby.actionTimeout) {
                clearTimeout(lobby.actionTimeout);
              }

              lobbies.delete(lobbyCode);
              gameEngines.delete(lobbyCode);
            } else {
              if (lobby.hostId === socket.id) {
                lobby.hostId = lobby.players[0].socketId;
              }
              broadcastLobbyState(lobbyCode);
            }
          }
        }, 30000);
      }
    }
  });

  /**
   * Reconnect to lobby with session token authentication
   */
  socket.on('reconnect', ({ lobbyCode, playerId, sessionToken }, callback) => {
    // Validate session token
    const storedSession = sessionTokens.get(playerId);

    if (!storedSession) {
      callback({ success: false, error: 'Session expired or invalid' });
      return;
    }

    if (storedSession.token !== sessionToken) {
      callback({ success: false, error: 'Invalid session token' });
      return;
    }

    if (Date.now() > storedSession.expiresAt) {
      sessionTokens.delete(playerId);
      callback({ success: false, error: 'Session expired' });
      return;
    }

    if (storedSession.lobbyCode !== lobbyCode) {
      callback({ success: false, error: 'Lobby mismatch' });
      return;
    }

    const lobby = lobbies.get(lobbyCode);
    if (!lobby) {
      callback({ success: false, error: 'Lobby not found' });
      return;
    }

    const player = lobby.players.find(p => p.id === playerId);
    if (!player) {
      callback({ success: false, error: 'Player not found' });
      return;
    }

    // Verify session token matches player's stored token
    if (player.sessionToken !== sessionToken) {
      callback({ success: false, error: 'Token mismatch' });
      return;
    }

    // Update socket ID and mark as reconnected
    player.socketId = socket.id;
    player.disconnected = false;

    socket.join(lobbyCode);
    socket.lobbyCode = lobbyCode;

    // Extend session expiration
    storedSession.expiresAt = Date.now() + 60 * 60 * 1000;

    console.log(`[${new Date().toLocaleTimeString()}] ${player.name} reconnected to ${lobbyCode} (authenticated)`);

    callback({ success: true });

    if (lobby.gameStarted) {
      broadcastGameState(lobbyCode);
    } else {
      broadcastLobbyState(lobbyCode);
    }
  });
});

const PORT = process.env.PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`\n🎮 Poker Server Running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for connections`);
  console.log(`🔗 Connect clients to: http://localhost:${PORT}\n`);
});
