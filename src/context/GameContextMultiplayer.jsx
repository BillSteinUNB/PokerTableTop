import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initializeGame,
  startNewHand,
  processPlayerAction,
  moveToNextHand,
  getValidActions,
  getMinRaise,
  ROUND_STATES
} from '../utils/gameEngine';
import { socketService } from '../services/socket';

const GameContext = createContext();

export function GameProvider({ children }) {
  // Game flow state
  const [currentView, setCurrentView] = useState('mainMenu');
  const [isMultiplayer, setIsMultiplayer] = useState(false); // Track if using multiplayer

  // Player data
  const [playerData, setPlayerData] = useState({
    name: '',
    avatar: 0,
    cardColor: 'classic',
    chipType: 'red'
  });

  // Lobby data
  const [lobbyData, setLobbyData] = useState({
    code: '',
    isHost: false,
    players: [],
    settings: {
      maxPlayers: 8,
      startingChips: 1000,
      smallBlind: 5,
      bigBlind: 10
    }
  });

  // Game state
  const [gameState, setGameState] = useState({
    pot: 0,
    currentPlayerIndex: 0,
    communityCards: [],
    players: [],
    roundState: 'waiting'
  });

  // Connection state
  const [connectionError, setConnectionError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Setup Socket.io listeners
  useEffect(() => {
    if (!isMultiplayer) return;

    // Listen for lobby updates
    socketService.onLobbyUpdate((lobbyUpdate) => {
      setLobbyData(prev => ({
        ...prev,
        players: lobbyUpdate.players,
        settings: lobbyUpdate.settings,
        isHost: lobbyUpdate.hostId === socketService.getSocketId()
      }));
    });

    // Listen for game state updates
    socketService.onGameStateUpdate((newGameState) => {
      setGameState(newGameState);
    });

    // Listen for game started event
    socketService.onGameStarted(() => {
      navigateTo('game');
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, [isMultiplayer]);

  // Navigation functions
  const navigateTo = (view) => setCurrentView(view);

  // Player functions
  const updatePlayerData = (data) => {
    setPlayerData(prev => ({ ...prev, ...data }));
  };

  // MULTIPLAYER: Create lobby
  const createLobbyMultiplayer = async (playerDataToUse = playerData) => {
    try {
      setIsConnecting(true);
      setConnectionError(null);

      const playerWithId = {
        ...playerDataToUse,
        id: socketService.getSocketId() || Date.now().toString()
      };

      console.log('[GameContext] Creating lobby with player data:', playerWithId);
      const code = await socketService.createLobby(playerWithId);

      setLobbyData(prev => ({
        ...prev,
        code,
        isHost: true,
        players: [playerWithId]
      }));

      setIsMultiplayer(true);
      setIsConnecting(false);
      return code;
    } catch (error) {
      console.error('[GameContext] Failed to create lobby:', error);
      setConnectionError(error.message);
      setIsConnecting(false);
      throw error;
    }
  };

  // MULTIPLAYER: Join lobby
  const joinLobbyMultiplayer = async (code, playerDataToUse = playerData) => {
    try {
      setIsConnecting(true);
      setConnectionError(null);

      const playerWithId = {
        ...playerDataToUse,
        id: socketService.getSocketId() || Date.now().toString()
      };

      console.log('[GameContext] Joining lobby:', code, 'with player:', playerWithId);
      await socketService.joinLobby(code, playerWithId);

      setLobbyData(prev => ({
        ...prev,
        code,
        isHost: false
      }));

      setIsMultiplayer(true);
      setIsConnecting(false);
    } catch (error) {
      console.error('[GameContext] Failed to join lobby:', error);
      setConnectionError(error.message);
      setIsConnecting(false);
      throw error;
    }
  };

  // LOCAL: Create lobby (for demo mode)
  const createLobbyLocal = (playerDataToUse = playerData) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setLobbyData({
      code,
      isHost: true,
      players: [playerDataToUse],
      settings: lobbyData.settings
    });
    setIsMultiplayer(false);
    return code;
  };

  // Unified create lobby (chooses multiplayer or local)
  const createLobby = (useMultiplayer = true, playerDataOverride = null) => {
    // Use override if provided, otherwise use context playerData
    const dataToUse = playerDataOverride || playerData;

    if (useMultiplayer) {
      return createLobbyMultiplayer(dataToUse);
    } else {
      return createLobbyLocal(dataToUse);
    }
  };

  // Unified join lobby (chooses multiplayer or local)
  const joinLobby = (code, useMultiplayer = true, playerDataOverride = null) => {
    const dataToUse = playerDataOverride || playerData;

    if (useMultiplayer) {
      return joinLobbyMultiplayer(code, dataToUse);
    } else {
      // Local join not implemented (not needed for demo)
      setLobbyData(prev => ({
        ...prev,
        code,
        isHost: false,
        players: [...prev.players, dataToUse]
      }));
      setIsMultiplayer(false);
    }
  };

  const updateLobbySettings = (settings) => {
    setLobbyData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }));
  };

  // MULTIPLAYER: Start game
  const startGameMultiplayer = async () => {
    try {
      await socketService.startGame();
      // State update will come from socket event
    } catch (error) {
      console.error('Failed to start game:', error);
      throw error;
    }
  };

  // LOCAL: Start game (for demo mode)
  const startGameLocal = () => {
    const initialGameState = initializeGame(lobbyData.players, lobbyData.settings);
    const gameWithCards = startNewHand(initialGameState);
    setGameState(gameWithCards);
    navigateTo('game');
  };

  // Unified start game
  const startGame = () => {
    if (isMultiplayer) {
      return startGameMultiplayer();
    } else {
      return startGameLocal();
    }
  };

  // MULTIPLAYER: Handle player action
  const handlePlayerActionMultiplayer = async (action, amount = 0) => {
    try {
      await socketService.sendPlayerAction(action, amount);
      // State update will come from socket event
    } catch (error) {
      console.error('Failed to send action:', error);
      setGameState(prev => ({
        ...prev,
        lastAction: { type: 'error', message: error.message }
      }));
    }
  };

  // LOCAL: Handle player action (for demo mode)
  const handlePlayerActionLocal = (action, amount = 0) => {
    const newGameState = processPlayerAction(gameState, action, amount);
    setGameState(newGameState);

    if (newGameState.roundState === ROUND_STATES.SHOWDOWN) {
      setTimeout(() => {
        const nextHandState = moveToNextHand(newGameState);
        setGameState(nextHandState);
      }, 5000);
    }
  };

  // Unified handle player action
  const handlePlayerAction = (action, amount = 0) => {
    if (isMultiplayer) {
      return handlePlayerActionMultiplayer(action, amount);
    } else {
      return handlePlayerActionLocal(action, amount);
    }
  };

  // MULTIPLAYER: Next hand
  const handleNextHandMultiplayer = () => {
    socketService.nextHand();
  };

  // LOCAL: Next hand
  const handleNextHandLocal = () => {
    const nextHandState = moveToNextHand(gameState);
    setGameState(nextHandState);
  };

  // Unified next hand
  const handleNextHand = () => {
    if (isMultiplayer) {
      return handleNextHandMultiplayer();
    } else {
      return handleNextHandLocal();
    }
  };

  const getPlayerValidActions = () => {
    return getValidActions(gameState);
  };

  const getMinimumRaise = () => {
    return getMinRaise(gameState);
  };

  // Leave lobby when navigating away
  const leaveLobby = () => {
    if (isMultiplayer) {
      socketService.leaveLobby();
    }
    setIsMultiplayer(false);
    setLobbyData({
      code: '',
      isHost: false,
      players: [],
      settings: lobbyData.settings
    });
  };

  const value = {
    currentView,
    navigateTo,
    playerData,
    updatePlayerData,
    lobbyData,
    createLobby,
    joinLobby,
    leaveLobby,
    updateLobbySettings,
    startGame,
    gameState,
    setGameState,
    handlePlayerAction,
    handleNextHand,
    getPlayerValidActions,
    getMinimumRaise,
    ROUND_STATES,
    isMultiplayer
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
