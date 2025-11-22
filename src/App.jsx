import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import MainMenu from './components/MainMenu/MainMenu';
import JoinGame from './components/JoinGame/JoinGame';
import CreateLobby from './components/CreateLobby/CreateLobby';
import CharacterSelection from './components/CharacterSelection/CharacterSelection';
import Lobby from './components/Lobby/Lobby';
import TopDownTable from './components/GameTable/TopDownTable';
import Controls from './components/Controls/Controls';
import './App.css';

/**
 * Game Router Component
 * Handles navigation between different game screens
 */
function GameRouter() {
  const { currentView } = useGame();

  switch (currentView) {
    case 'mainMenu':
      return <MainMenu />;
    case 'joinGame':
      return <JoinGame />;
    case 'createLobby':
      return <CreateLobby />;
    case 'characterSelect':
      return <CharacterSelection />;
    case 'lobby':
      return <Lobby />;
    case 'game':
      return (
        <div className="game-view">
          <TopDownTable />
        </div>
      );
    default:
      return <MainMenu />;
  }
}

/**
 * Main App Component
 * Multiplayer pixel-art poker game
 */
function App() {
  return (
    <GameProvider>
      <div className="app">
        <GameRouter />
      </div>
    </GameProvider>
  );
}

export default App;
