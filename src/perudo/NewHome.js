import React, { useState, useEffect } from 'react';
import { GameProvider } from './context/GameContext';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { useGameActions } from './hooks/useGameActions';
import { useGameSubscription } from './hooks/useGameSubscription';
import { useGame } from './context/GameContext';
import GameLayout from './components/layout/GameLayout';
import WaitingRoom from './components/lobby/WaitingRoom';
import GameBoard from './components/game/GameBoard';
import Button from './components/ui/Button';
import ErrorDisplay from './components/ui/ErrorDisplay';

// Composant pour la connexion du joueur
const PlayerConnection = () => {
  const [playerName, setPlayerName] = useState('');
  const { playerId, hasValidPlayer, actions: playerActions } = usePlayer();
  const { joinOrCreateLobby } = useGameActions();
  const { isLoading, error, actions: gameActions } = useGame();

  const handleConnect = async (retryCount = 0) => {
    if (!playerName.trim()) {
      gameActions.setError('Veuillez entrer votre nom');
      return;
    }

    try {
      const generatedPlayerId = playerActions.connectPlayer(playerName.trim());
      await joinOrCreateLobby({
        id: generatedPlayerId,
        name: playerName.trim()
      });
    } catch (error) {
      console.error('Connection error:', error);
      
      // Gérer automatiquement les collisions d'ID
      if (error.message === 'ID_COLLISION_RETRY_NEEDED' && retryCount < 3) {
        console.log(`🔄 Retrying connection with new ID (attempt ${retryCount + 1})`);
        
        // Forcer un nouvel ID et réessayer
        const newId = playerActions.forceNewId(playerName.trim());
        
        try {
          await joinOrCreateLobby({
            id: newId,
            name: playerName.trim()
          });
        } catch (retryError) {
          if (retryCount < 2) {
            // Réessayer une fois de plus
            await handleConnect(retryCount + 1);
          } else {
            gameActions.setError('Impossible de se connecter après plusieurs tentatives. Veuillez rafraîchir la page.');
          }
        }
      }
    }
  };

  if (hasValidPlayer && playerId) {
    return null; // Le joueur est connecté, on affiche le jeu
  }

  return (
    <GameLayout>
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <h1 className="perudo-title mb-8">Perudo Game</h1>
        <div className="flex flex-col gap-4 w-full max-w-md px-4">
          <input
            type="text"
            placeholder="Votre nom"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="px-4 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
            disabled={isLoading}
          />
          <Button
            onClick={handleConnect}
            disabled={isLoading || !playerName.trim()}
          >
            {isLoading ? 'Connexion...' : 'Rejoindre/Créer le lobby'}
          </Button>
          <div className="text-sm text-gray-400 text-center">
            Entrez votre nom pour rejoindre automatiquement<br />
            le lobby existant ou en créer un nouveau
          </div>
          
          {/* Debug button (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={() => {
                const info = playerActions.getIdInfo();
                console.log('🔍 Device ID Info:', info);
                alert(`Device ID: ${info.fullId}\nTimestamp: ${info.timestampDate}`);
              }}
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Debug ID Info
            </button>
          )}
        </div>
        {error && <ErrorDisplay error={error} onClose={() => gameActions.setError(null)} />}
      </div>
    </GameLayout>
  );
};

// Composant principal du jeu
const GameContent = () => {
  const { gameData, isWaiting, isPlaying, isFinished } = useGame();
  const { hasValidPlayer } = usePlayer();

  // Configurer la subscription Firebase
  useGameSubscription();

  // Si le joueur n'est pas connecté, afficher l'écran de connexion
  if (!hasValidPlayer) {
    return <PlayerConnection />;
  }

  // Si pas de données de jeu, afficher le chargement
  if (!gameData) {
    return (
      <GameLayout>
        <div className="flex flex-col items-center justify-center min-h-screen text-white">
          <div className="animate-pulse text-xl">Chargement du lobby...</div>
        </div>
      </GameLayout>
    );
  }

  // Afficher l'interface appropriée selon l'état du jeu
  if (isWaiting) {
    return (
      <GameLayout>
        <WaitingRoom />
      </GameLayout>
    );
  }

  if (isPlaying || isFinished) {
    return (
      <GameLayout>
        <GameBoard />
      </GameLayout>
    );
  }

  // État inattendu
  return (
    <GameLayout>
      <div className="flex flex-col items-center justify-center min-h-screen text-white">
        <div className="text-red-500">État de jeu inattendu</div>
      </div>
    </GameLayout>
  );
};

// Composant racine avec les providers
const NewHome = () => {
  return (
    <PlayerProvider>
      <GameProvider>
        <GameContent />
      </GameProvider>
    </PlayerProvider>
  );
};

export default NewHome;