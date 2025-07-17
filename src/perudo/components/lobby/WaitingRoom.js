import React from 'react';
import { useGame } from '../../context/GameContext';
import { usePlayer } from '../../context/PlayerContext';
import { useGameActions } from '../../hooks/useGameActions';
import { usePlayerActions } from '../../hooks/usePlayerActions';
import Button from '../ui/Button';
import ErrorDisplay from '../ui/ErrorDisplay';
import { GAME_CONFIG } from '../../utils/constants';

// Composant pour afficher la liste des joueurs
const PlayerList = ({ players, currentPlayerId }) => {
  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-lg">
      <h3 className="mb-2 text-lg">Joueurs connectés ({players.length})</h3>
      {players.map(player => (
        <div key={player.id} className="mb-2 flex items-center gap-2">
          <span className={player.id === currentPlayerId ? 'font-bold text-blue-400' : ''}>
            {player.name}
          </span>
          {player.isCreator && <span className="text-yellow-400">👑 Créateur</span>}
          {player.isReady ? (
            <span className="text-green-400">✓ Prêt</span>
          ) : (
            <span className="text-red-400">✗ Pas prêt</span>
          )}
        </div>
      ))}
    </div>
  );
};

// Composant pour les contrôles du lobby
const LobbyControls = ({ isCreator, canStartGame, currentPlayerReady, onToggleReady, onStartGame, onCancel }) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Bouton pour se marquer prêt/pas prêt */}
      <Button
        onClick={() => onToggleReady(!currentPlayerReady)}
        style={{ 
          backgroundColor: currentPlayerReady ? '#dc2626' : '#16a34a' 
        }}
      >
        {currentPlayerReady ? 'Pas prêt' : 'Prêt'}
      </Button>
      
      {/* Boutons pour le créateur */}
      {isCreator && (
        <>
          <Button
            onClick={onStartGame}
            disabled={!canStartGame}
            style={{ 
              backgroundColor: canStartGame ? '#16a34a' : '#6b7280' 
            }}
          >
            Démarrer la partie
          </Button>
          <Button
            onClick={onCancel}
            style={{ backgroundColor: '#dc2626' }}
          >
            Fermer le lobby
          </Button>
        </>
      )}
    </div>
  );
};

// Composant pour les messages d'état
const StatusMessages = ({ playerCount, allPlayersReady }) => {
  if (playerCount < GAME_CONFIG.MIN_PLAYERS) {
    return (
      <div className="mt-4 text-sm text-gray-400">
        En attente d'autres joueurs... (min {GAME_CONFIG.MIN_PLAYERS} joueurs)
      </div>
    );
  }

  if (!allPlayersReady) {
    return (
      <div className="mt-4 text-sm text-gray-400">
        En attente que tous les joueurs soient prêts...
      </div>
    );
  }

  return null;
};

// Composant principal de la salle d'attente
const WaitingRoom = () => {
  const { players, error, actions: gameActions } = useGame();
  const { playerId } = usePlayer();
  const { isCreator, canStartGame, startGame, cancelGame } = useGameActions();
  const { toggleReady } = usePlayerActions();

  const currentPlayer = players.find(p => p.id === playerId);
  const allPlayersReady = players.length >= GAME_CONFIG.MIN_PLAYERS && players.every(p => p.isReady);

  const handleToggleReady = async (isReady) => {
    try {
      await toggleReady(isReady);
    } catch (error) {
      console.error('Error toggling ready status:', error);
    }
  };

  const handleStartGame = async () => {
    try {
      await startGame();
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleCancelGame = async () => {
    try {
      await cancelGame();
    } catch (error) {
      console.error('Error canceling game:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white">
      <h2 className="mb-4 text-2xl">🏠 Lobby Perudo</h2>
      
      <PlayerList 
        players={players} 
        currentPlayerId={playerId} 
      />
      
      <LobbyControls
        isCreator={isCreator}
        canStartGame={canStartGame}
        currentPlayerReady={currentPlayer?.isReady}
        onToggleReady={handleToggleReady}
        onStartGame={handleStartGame}
        onCancel={handleCancelGame}
      />
      
      <StatusMessages 
        playerCount={players.length}
        allPlayersReady={allPlayersReady}
      />
      
      {error && (
        <ErrorDisplay 
          error={error} 
          onClose={() => gameActions.setError(null)} 
        />
      )}
    </div>
  );
};

export default WaitingRoom;