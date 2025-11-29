/**
 * Socket.io Client Service
 * Handles all WebSocket communication with the server
 */

import { io } from 'socket.io-client';

// Use environment variable or default to localhost for development
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3002';

console.log('[Socket] Server URL:', SERVER_URL);

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.lobbyCode = null;
    this.playerId = null;
    this.connectionTimeout = null;
  }

  /**
   * Connect to the WebSocket server
   */
  connect() {
    if (this.socket && this.connected) {
      console.log('[Socket] Already connected');
      return Promise.resolve();
    }

    // Clear any existing socket
    if (this.socket && !this.connected) {
      console.log('[Socket] Cleaning up previous socket');
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }

    return new Promise((resolve, reject) => {
      console.log(`[Socket] Attempting to connect to ${SERVER_URL}...`);

      // Set connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (!this.connected) {
          console.error('[Socket] Connection timeout');
          reject(new Error('Connection timeout - is the server running?'));
        }
      }, 10000); // 10 second timeout

      this.socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        timeout: 10000
      });

      this.socket.on('connect', () => {
        console.log(`[Socket] ✅ Connected to server (ID: ${this.socket.id})`);
        this.connected = true;
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`[Socket] Disconnected from server. Reason: ${reason}`);
        this.connected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error.message);
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        reject(new Error(`Failed to connect to server at ${SERVER_URL}. Is the server running?`));
      });

      this.socket.on('error', (error) => {
        console.error('[Socket] Socket error:', error);
      });
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Check if a lobby exists
   */
  async checkLobby(lobbyCode) {
    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('checkLobby', lobbyCode, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Create a new lobby
   */
  async createLobby(playerData) {
    await this.connect();

    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('createLobby', playerData, (response) => {
        if (response.success) {
          this.lobbyCode = response.lobbyCode;
          this.playerId = playerData.id || this.socket.id;
          console.log(`[Socket] ✅ Lobby created: ${response.lobbyCode}`);
          resolve(response.lobbyCode);
        } else {
          console.error('[Socket] Failed to create lobby:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Join an existing lobby
   */
  async joinLobby(lobbyCode, playerData) {
    await this.connect();

    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('joinLobby', { lobbyCode, playerData }, (response) => {
        if (response.success) {
          this.lobbyCode = lobbyCode;
          this.playerId = playerData.id || this.socket.id;
          console.log(`[Socket] ✅ Joined lobby: ${lobbyCode}`);
          resolve();
        } else {
          console.error('[Socket] Failed to join lobby:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Leave the current lobby
   */
  leaveLobby() {
    if (this.socket && this.lobbyCode && this.isConnected()) {
      console.log('[Socket] Leaving lobby:', this.lobbyCode);
      this.socket.emit('leaveLobby');
      this.lobbyCode = null;
    }
  }

  /**
   * Start the game (host only)
   */
  async startGame() {
    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      console.log('[Socket] Starting game...');
      this.socket.emit('startGame', (response) => {
        if (response.success) {
          console.log('[Socket] ✅ Game started');
          resolve();
        } else {
          console.error('[Socket] Failed to start game:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Send a player action
   */
  async sendPlayerAction(action, amount = 0) {
    if (!this.isConnected()) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('playerAction', { action, amount }, (response) => {
        if (response.success) {
          resolve();
        } else {
          console.error('[Socket] Action failed:', response.error);
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Request next hand
   */
  nextHand() {
    if (this.socket && this.isConnected()) {
      this.socket.emit('nextHand');
    }
  }

  /**
   * Listen for lobby updates
   */
  onLobbyUpdate(callback) {
    if (this.socket) {
      this.socket.on('lobbyUpdate', callback);
    }
  }

  /**
   * Listen for game state updates
   */
  onGameStateUpdate(callback) {
    if (this.socket) {
      this.socket.on('gameStateUpdate', callback);
    }
  }

  /**
   * Listen for game started event
   */
  onGameStarted(callback) {
    if (this.socket) {
      this.socket.on('gameStarted', callback);
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  /**
   * Check if currently connected
   */
  isConnected() {
    return this.connected && this.socket !== null;
  }

  /**
   * Get current lobby code
   */
  getLobbyCode() {
    return this.lobbyCode;
  }

  /**
   * Get socket ID
   */
  getSocketId() {
    return this.socket?.id;
  }
}

// Export singleton instance
export const socketService = new SocketService();
