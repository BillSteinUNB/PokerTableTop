/**
 * Multiplayer Poker Server
 * WebSocket server using Socket.io for real-time poker game
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameEngine } from './gameEngine.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store active lobbies and game engines
const lobbies = new Map();
const gameEngines = new Map();

/**
 * Generate a unique 6-character lobby code
 */
function generateLobbyCode() {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (lobbies.has(code));
  return code;
}

/**
 * Broadcast game state to all players in a lobby
 */
function broadcastGameState(lobbyCode) {
  const engine = gameEngines.get(lobbyCode);
  if (engine) {
    const gameState = engine.getGameState();
    io.to(lobbyCode).emit('gameStateUpdate', gameState);
  }
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

  /**
   * Create a new lobby
   */
  socket.on('createLobby', (playerData, callback) => {
    try {
      if (!playerData || !playerData.name) {
        callback({ success: false, error: 'Invalid player data' });
        return;
      }

      const lobbyCode = generateLobbyCode();

      const lobby = {
        code: lobbyCode,
        hostId: socket.id,
        players: [{
          ...playerData,
          id: socket.id,
          socketId: socket.id
        }],
        settings: {
          smallBlind: 5,
          bigBlind: 10,
          startingChips: 1000,
          minPlayers: 2,
          maxPlayers: 8
        },
        gameStarted: false
      };

      lobbies.set(lobbyCode, lobby);
      socket.join(lobbyCode);
      socket.lobbyCode = lobbyCode;

      console.log(`[${new Date().toLocaleTimeString()}] Lobby created: ${lobbyCode} by ${playerData.name} (${socket.id})`);

      callback({ success: true, lobbyCode });
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
      if (!lobbyCode || !playerData || !playerData.name) {
        callback({ success: false, error: 'Invalid lobby code or player data' });
        return;
      }

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

      // Check if player name is already taken
      if (lobby.players.some(p => p.name === playerData.name)) {
        callback({ success: false, error: 'Name already taken' });
        return;
      }

      lobby.players.push({
        ...playerData,
        id: socket.id,
        socketId: socket.id
      });

      socket.join(lobbyCode);
      socket.lobbyCode = lobbyCode;

      console.log(`[${new Date().toLocaleTimeString()}] ${playerData.name} (${socket.id}) joined lobby: ${lobbyCode}`);

      callback({ success: true, lobbyCode });
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
  });

  /**
   * Player action
   */
  socket.on('playerAction', ({ action, amount }, callback) => {
    const lobbyCode = socket.lobbyCode;
    const engine = gameEngines.get(lobbyCode);

    if (!engine) {
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

    try {
      engine.handlePlayerAction(action, amount);
      callback({ success: true });
      broadcastGameState(lobbyCode);

      // If showdown, auto-advance after delay
      const newState = engine.getGameState();
      if (newState.roundState === 'showdown') {
        setTimeout(() => {
          engine.nextHand();
          broadcastGameState(lobbyCode);
        }, 5000);
      }
    } catch (error) {
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
   * Handle disconnection
   */
  socket.on('disconnect', () => {
    console.log(`[${new Date().toLocaleTimeString()}] Player disconnected: ${socket.id}`);

    const lobbyCode = socket.lobbyCode;
    if (!lobbyCode) return;

    const lobby = lobbies.get(lobbyCode);
    if (!lobby) return;

    // Mark player as disconnected instead of removing immediately
    const player = lobby.players.find(p => p.socketId === socket.id);
    if (player) {
      player.disconnected = true;
      console.log(`[${new Date().toLocaleTimeString()}] ${player.name} disconnected from ${lobbyCode}`);

      // If game hasn't started, remove player after 30 seconds
      if (!lobby.gameStarted) {
        setTimeout(() => {
          const stillDisconnected = lobby.players.find(p => p.socketId === socket.id && p.disconnected);
          if (stillDisconnected) {
            lobby.players = lobby.players.filter(p => p.socketId !== socket.id);

            if (lobby.players.length === 0) {
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
   * Reconnect to lobby
   */
  socket.on('reconnect', ({ lobbyCode, playerId }, callback) => {
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

    // Update socket ID
    player.socketId = socket.id;
    player.disconnected = false;

    socket.join(lobbyCode);
    socket.lobbyCode = lobbyCode;

    console.log(`[${new Date().toLocaleTimeString()}] ${player.name} reconnected to ${lobbyCode}`);

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
