/**
 * Socket.io Client Service
 * Handles all WebSocket communication with the server
 */

import { io } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.lobbyCode = null;
    this.playerId = null;
  }

  /**
   * Connect to the WebSocket server
   */
  connect() {
    if (this.socket && this.connected) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      this.socket = io(SERVER_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('[Socket] Connected to server');
        this.connected = true;
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('[Socket] Disconnected from server');
        this.connected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error);
        reject(error);
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
   * Create a new lobby
   */
  async createLobby(playerData) {
    await this.connect();

    return new Promise((resolve, reject) => {
      this.socket.emit('createLobby', playerData, (response) => {
        if (response.success) {
          this.lobbyCode = response.lobbyCode;
          this.playerId = playerData.id || this.socket.id;
          resolve(response.lobbyCode);
        } else {
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

    return new Promise((resolve, reject) => {
      this.socket.emit('joinLobby', { lobbyCode, playerData }, (response) => {
        if (response.success) {
          this.lobbyCode = lobbyCode;
          this.playerId = playerData.id || this.socket.id;
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Leave the current lobby
   */
  leaveLobby() {
    if (this.socket && this.lobbyCode) {
      this.socket.emit('leaveLobby');
      this.lobbyCode = null;
    }
  }

  /**
   * Start the game (host only)
   */
  async startGame() {
    return new Promise((resolve, reject) => {
      this.socket.emit('startGame', (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Send a player action
   */
  async sendPlayerAction(action, amount = 0) {
    return new Promise((resolve, reject) => {
      this.socket.emit('playerAction', { action, amount }, (response) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }

  /**
   * Request next hand
   */
  nextHand() {
    if (this.socket) {
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
