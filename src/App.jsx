import React from 'react';
import { GameProvider, useGame } from './context/GameContextMultiplayer';
import MainMenu from './components/MainMenu/MainMenu';
import JoinGame from './components/JoinGame/JoinGame';
import CreateLobby from './components/CreateLobby/CreateLobby';
import CharacterSelection from './components/CharacterSelection/CharacterSelection';
import Lobby from './components/Lobby/Lobby';
import TopDownTable from './components/GameTable/TopDownTable';
import Controls from './components/Controls/Controls';
import ExitButton from './components/ExitButton/ExitButton';
import ForceNextHandButton from './components/ForceNextHandButton/ForceNextHandButton';
import PostGameScreen from './components/PostGameScreen/PostGameScreen';
import './App.css';

/**
 * Game Router Component
 * Handles navigation between different game screens
 */
function GameRouter() {
  const { currentView, leaveGame, lobbyData, forceNextHand } = useGame();

  const handleExitGame = () => {
    if (window.confirm('Are you sure you want to leave the game?')) {
      leaveGame();
    }
  };

  const handleForceNextHand = () => {
    if (window.confirm('Skip to next hand? (All remaining players will fold)')) {
      forceNextHand();
    }
  };

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
    case 'postGame':
      return <PostGameScreen />;
    case 'game':
      return (
        <div className="game-view">
          <TopDownTable />
          <ExitButton onClick={handleExitGame} />
          {/* Only show force next hand button to host (for debugging) */}
          {lobbyData.isHost && (
            <ForceNextHandButton onClick={handleForceNextHand} />
          )}
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
  // Prevent image dragging and right-click saving
  React.useEffect(() => {
    // Prevent context menu (right-click) on images
    const handleContextMenu = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    // Prevent drag start on images
    const handleDragStart = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    // Cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  return (
    <GameProvider>
      <div className="app">
        <GameRouter />
      </div>
    </GameProvider>
  );
}

export default App;
