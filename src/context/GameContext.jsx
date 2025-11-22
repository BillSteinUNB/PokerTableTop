import React, { createContext, useContext, useState } from 'react';
import {
  initializeGame,
  startNewHand,
  processPlayerAction,
  moveToNextHand,
  getValidActions,
  getMinRaise,
  ROUND_STATES
} from '../utils/gameEngine';

const GameContext = createContext();

export function GameProvider({ children }) {
  // Game flow state
  const [currentView, setCurrentView] = useState('mainMenu'); // mainMenu, joinGame, createLobby, characterSelect, lobby, game

  // Player data
  const [playerData, setPlayerData] = useState({
    name: '',
    avatar: 0, // 0-7 for 8 different characters
    cardColor: 'classic', // classic, red, blue, green, purple
    chipType: 'classic' // classic, casino, neon
  });

  // Lobby data
  const [lobbyData, setLobbyData] = useState({
    code: '',
    isHost: false,
    players: [],
    settings: {
      maxPlayers: 6,
      startingChips: 1000,
      smallBlind: 10,
      bigBlind: 20
    }
  });

  // Game state
  const [gameState, setGameState] = useState({
    pot: 0,
    currentPlayerIndex: 0,
    communityCards: [],
    players: [],
    roundState: 'waiting' // waiting, preflop, flop, turn, river, showdown
  });

  // Navigation functions
  const navigateTo = (view) => setCurrentView(view);

  // Player functions
  const updatePlayerData = (data) => {
    setPlayerData(prev => ({ ...prev, ...data }));
  };

  // Lobby functions
  const createLobby = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setLobbyData({
      code,
      isHost: true,
      players: [playerData],
      settings: lobbyData.settings
    });
    return code;
  };

  const joinLobby = (code) => {
    // In a real app, this would connect to server
    setLobbyData(prev => ({
      ...prev,
      code,
      isHost: false,
      players: [...prev.players, playerData]
    }));
  };

  const updateLobbySettings = (settings) => {
    setLobbyData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...settings }
    }));
  };

  const startGame = () => {
    // Initialize game with game engine
    const initialGameState = initializeGame(lobbyData.players, lobbyData.settings);
    const gameWithCards = startNewHand(initialGameState);
    setGameState(gameWithCards);
    navigateTo('game');
  };

  // Game action handlers
  const handlePlayerAction = (action, amount = 0) => {
    const newGameState = processPlayerAction(gameState, action, amount);
    setGameState(newGameState);

    // If hand is complete, wait a bit then move to next hand
    if (newGameState.roundState === ROUND_STATES.SHOWDOWN) {
      setTimeout(() => {
        const nextHandState = moveToNextHand(newGameState);
        setGameState(nextHandState);
      }, 5000); // Wait 5 seconds to show results
    }
  };

  const handleNextHand = () => {
    const nextHandState = moveToNextHand(gameState);
    setGameState(nextHandState);
  };

  const getPlayerValidActions = () => {
    return getValidActions(gameState);
  };

  const getMinimumRaise = () => {
    return getMinRaise(gameState);
  };

  const value = {
    currentView,
    navigateTo,
    playerData,
    updatePlayerData,
    lobbyData,
    createLobby,
    joinLobby,
    updateLobbySettings,
    startGame,
    gameState,
    setGameState,
    handlePlayerAction,
    handleNextHand,
    getPlayerValidActions,
    getMinimumRaise,
    ROUND_STATES
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
