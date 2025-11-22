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
    chipType: 'black'
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
  const createLobbyMultiplayer = async () => {
    try {
      const playerWithId = {
        ...playerData,
        id: socketService.getSocketId() || Date.now().toString()
      };

      const code = await socketService.createLobby(playerWithId);

      setLobbyData(prev => ({
        ...prev,
        code,
        isHost: true,
        players: [playerWithId]
      }));

      setIsMultiplayer(true);
      return code;
    } catch (error) {
      console.error('Failed to create lobby:', error);
      throw error;
    }
  };

  // MULTIPLAYER: Join lobby
  const joinLobbyMultiplayer = async (code) => {
    try {
      const playerWithId = {
        ...playerData,
        id: socketService.getSocketId() || Date.now().toString()
      };

      await socketService.joinLobby(code, playerWithId);

      setLobbyData(prev => ({
        ...prev,
        code,
        isHost: false
      }));

      setIsMultiplayer(true);
    } catch (error) {
      console.error('Failed to join lobby:', error);
      throw error;
    }
  };

  // LOCAL: Create lobby (for demo mode)
  const createLobbyLocal = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setLobbyData({
      code,
      isHost: true,
      players: [playerData],
      settings: lobbyData.settings
    });
    setIsMultiplayer(false);
    return code;
  };

  // Unified create lobby (chooses multiplayer or local)
  const createLobby = (useMultiplayer = true) => {
    if (useMultiplayer) {
      return createLobbyMultiplayer();
    } else {
      return createLobbyLocal();
    }
  };

  // Unified join lobby (chooses multiplayer or local)
  const joinLobby = (code, useMultiplayer = true) => {
    if (useMultiplayer) {
      return joinLobbyMultiplayer(code);
    } else {
      // Local join not implemented (not needed for demo)
      setLobbyData(prev => ({
        ...prev,
        code,
        isHost: false,
        players: [...prev.players, playerData]
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
