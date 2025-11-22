import React, { createContext, useContext, useState } from 'react';

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
    // Initialize game state with lobby players
    setGameState({
      pot: 0,
      currentPlayerIndex: 0,
      communityCards: [],
      players: lobbyData.players.map((player, index) => ({
        ...player,
        chips: lobbyData.settings.startingChips,
        hand: [],
        currentBet: 0,
        folded: false,
        position: index
      })),
      roundState: 'preflop'
    });
    navigateTo('game');
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
    setGameState
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
