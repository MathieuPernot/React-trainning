import React, { useState, useEffect } from 'react';
import {
  subscribeToGame,
  joinRoom,
  startGame,
  placeBid,
  challengeBid,
  resetGame,
  createRoom,
  checkRoomExists,
  disconnectPlayer
} from '../backend/gameService';

// Composant pour le formulaire de connexion
const LoginForm = ({ onSubmit, initialName }) => {
  const [name, setName] = useState(initialName || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) onSubmit(name);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-xs">
      <h2 className="text-xl mb-4">Entrez votre nom</h2>
      <form onSubmit={handleSubmit} className="w-full">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Votre nom"
          className="w-full p-2 mb-4 text-white bg-gray-800 rounded"
          minLength={2}
          maxLength={20}
          required
          autoFocus
        />
        <button 
          type="submit" 
          className="w-full p-2 bg-purple-600 rounded hover:bg-purple-700"
        >
          Rejoindre
        </button>
      </form>
    </div>
  );
};

// Composant pour la salle d'attente
const WaitingRoom = ({ players = [], isHost, onStartGame }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
    <h2 className="mb-4 text-xl">Salle d'attente</h2>
    <div className="mb-4">
      {Array.isArray(players) && players.map(player => (
        <div key={player.id} className="mb-2">
          {player.name} {player.isHost && '(Hôte)'}
        </div>
      ))}
    </div>
    {isHost && Array.isArray(players) && players.length >= 2 && (
      <button
        onClick={onStartGame}
        className="p-2 bg-green-600 rounded hover:bg-green-700"
      >
        Démarrer la partie
      </button>
    )}
  </div>
);

// Fonction utilitaire pour valider une enchère (même logique que côté serveur)
const isValidBid = (currentBid, lastBid) => {
  if (!lastBid) return true;

  const currentValue = currentBid.diceValue;
  const lastValue = lastBid.diceValue;
  const currentCount = currentBid.diceCount;
  const lastCount = lastBid.diceCount;

  if (lastValue !== 1 && currentValue === 1) {
    return currentCount >= Math.ceil(lastCount / 2);
  }

  if (lastValue === 1 && currentValue !== 1) {
    return currentCount >= (lastCount * 2) + 1;
  }

  if (currentValue === lastValue) {
    return currentCount > lastCount;
  }

  if (currentValue > lastValue) {
    return currentCount >= lastCount;
  }

  if (currentValue < lastValue) {
    return currentCount > lastCount;
  }

  return false;
};

// Composant pour le plateau de jeu
const GameBoard = ({ gameState, playerId, onPlaceBid, onDudo, onReset }) => {
  const [bidValue, setBidValue] = useState(2);
  const [bidCount, setBidCount] = useState(1);
  const [bidError, setBidError] = useState('');

  if (!gameState?.players) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
        <div>Chargement du plateau de jeu...</div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const isCurrentTurn = gameState.currentTurn === playerId;
  const totalDice = gameState.players.reduce((sum, p) => sum + (p.diceCount || 0), 0);

  if (!currentPlayer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
        <div>Joueur non trouvé dans la partie</div>
      </div>
    );
  }

  // Validation de l'enchère avant de l'envoyer
  const validateAndPlaceBid = () => {
    const currentBid = { diceValue: bidValue, diceCount: bidCount };
    
    if (gameState.lastBid && !isValidBid(currentBid, gameState.lastBid)) {
      if (gameState.lastBid.diceValue === 1) {
        setBidError(`Pour sortir des Paco (1), il faut au moins ${(gameState.lastBid.diceCount * 2) + 1} dés`);
      } else if (bidValue === 1) {
        setBidError(`Pour passer aux Paco (1), il faut au moins ${Math.ceil(gameState.lastBid.diceCount / 2)} dés`);
      } else if (bidValue === gameState.lastBid.diceValue && bidCount <= gameState.lastBid.diceCount) {
        setBidError(`Avec la même valeur (${bidValue}), vous devez annoncer plus de ${gameState.lastBid.diceCount} dés`);
      } else if (bidValue > gameState.lastBid.diceValue && bidCount < gameState.lastBid.diceCount) {
        setBidError(`Avec une valeur supérieure (${bidValue}), vous devez annoncer au moins ${gameState.lastBid.diceCount} dés`);
      } else if (bidValue < gameState.lastBid.diceValue && bidCount <= gameState.lastBid.diceCount) {
        setBidError(`Avec une valeur inférieure (${bidValue}), vous devez annoncer plus de ${gameState.lastBid.diceCount} dés`);
      }
      return;
    }

    setBidError('');
    onPlaceBid(bidValue, bidCount);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
      <div className="mb-8">
        <h2 className="mb-4 text-xl">Tour {gameState.round || 1}</h2>
        <div className="text-sm text-gray-400 mb-2">
          Total des dés en jeu: {totalDice}
        </div>
        {gameState.lastBid && (
          <div className="mb-4 p-2 bg-gray-800 rounded">
            Dernière enchère: {gameState.lastBid.diceCount} × {gameState.lastBid.diceValue}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h3 className="mb-2 text-lg">Vos dés:</h3>
        <div className="flex gap-2">
          {Array.isArray(currentPlayer.dice) && currentPlayer.dice.map((value, index) => (
            <div
              key={index}
              className="flex items-center justify-center w-10 h-10 text-black bg-white rounded"
            >
              {value}
            </div>
          ))}
        </div>
      </div>

      {isCurrentTurn && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <label className="mb-1 text-sm">Valeur du dé</label>
              <input
                type="number"
                min="1"
                max="6"
                value={bidValue}
                onChange={(e) => {
                  setBidValue(parseInt(e.target.value) || 1);
                  setBidError('');
                }}
                className="w-20 p-2 bg-gray-800 rounded text-center"
              />
            </div>
            <div className="flex flex-col items-center">
              <label className="mb-1 text-sm">Nombre de dés</label>
              <input
                type="number"
                min="1"
                max={totalDice}
                value={bidCount}
                onChange={(e) => {
                  setBidCount(parseInt(e.target.value) || 1);
                  setBidError('');
                }}
                className="w-20 p-2 bg-gray-800 rounded text-center"
              />
            </div>
          </div>
          {bidError && (
            <div className="text-red-500 text-sm text-center">
              {bidError}
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={validateAndPlaceBid}
              className="p-2 bg-blue-600 rounded hover:bg-blue-700"
            >
              Enchérir
            </button>
            {gameState.lastBid && (
              <button
                onClick={onDudo}
                className="p-2 bg-red-600 rounded hover:bg-red-700"
              >
                Dudo!
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h3 className="mb-2 text-lg">Joueurs:</h3>
        {gameState.players.map(player => (
          <div
            key={player.id}
            className={gameState.currentTurn === player.id ? 'text-yellow-400' : ''}
          >
            {player.name} ({player.diceCount || 0} dés)
          </div>
        ))}
      </div>

      {gameState.status === 'finished' && gameState.hostId === playerId && (
        <button
          onClick={onReset}
          className="mt-8 p-2 bg-green-600 rounded hover:bg-green-700"
        >
          Nouvelle partie
        </button>
      )}
    </div>
  );
};

export default function Game() {
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isHost] = useState(() => localStorage.getItem('perudoIsHost') === 'true');
  const [gameEndMessage, setGameEndMessage] = useState('');

  // Gérer la déconnexion quand le composant est démonté ou la fenêtre est fermée
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playerId) {
        disconnectPlayer(playerId);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (playerId) {
        disconnectPlayer(playerId);
      }
    };
  }, [playerId]);

  useEffect(() => {
    // Récupérer l'ID et le nom du joueur du localStorage
    const storedId = localStorage.getItem('perudoPlayerId');
    const storedName = localStorage.getItem('perudoPlayerName');
    if (storedId && storedName) {
      setPlayerId(storedId);
      setPlayerName(storedName);
    }

    // S'abonner aux mises à jour du jeu
    console.log('Subscribing to game updates...');
    const unsubscribe = subscribeToGame((newGameState) => {
      console.log('Game state updated:', newGameState);
      setGameState(newGameState);

      // Si le joueur n'est plus dans la partie (déconnecté par un autre onglet par exemple)
      if (newGameState && storedId && !newGameState.players.some(p => p.id === storedId)) {
        setPlayerId(null);
        setPlayerName(null);
        localStorage.removeItem('perudoPlayerId');
        localStorage.removeItem('perudoPlayerName');
      }
    });

    return () => {
      console.log('Unsubscribing from game updates...');
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!gameState) return;

    if (gameState.status === 'finished') {
      const winner = gameState.players.find(p => p.diceCount > 0);
      if (winner) {
        setGameEndMessage(`🎉 ${winner.name} a gagné la partie ! 🎉`);
      }
    }
  }, [gameState]);

  const handleJoinGame = async (name) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let newPlayerId = playerId;
      if (!newPlayerId) {
        newPlayerId = `player_${Date.now()}`;
      }
      
      // Rejoindre la room
      console.log('Joining room...');
      await joinRoom({ 
        id: newPlayerId, 
        name,
        isHost: isHost,
        isConnected: true
      });
      
      // Sauvegarder l'ID et le nom du joueur
      localStorage.setItem('perudoPlayerId', newPlayerId);
      localStorage.setItem('perudoPlayerName', name);
      setPlayerId(newPlayerId);
      setPlayerName(name);
      
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      setError(error.message || 'Erreur lors de la connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartGame = async () => {
    try {
      setIsLoading(true);
      await startGame();
    } catch (error) {
      console.error('Erreur lors du démarrage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceBid = async (value, count) => {
    if (!playerId) return;
    try {
      setIsLoading(true);
      setError(null);
      await placeBid(playerId, { diceValue: value, diceCount: count });
    } catch (error) {
      console.error('Error placing bid:', error);
      setError(error.message);
      if (error.message.includes('partie est terminée')) {
        const winner = gameState.players.find(p => p.diceCount > 0);
        if (winner) {
          setGameEndMessage(`🎉 ${winner.name} a gagné la partie ! 🎉`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDudo = async () => {
    if (!playerId) return;
    try {
      await challengeBid(playerId);
    } catch (error) {
      console.error('Erreur lors du Dudo:', error);
    }
  };

  const handleResetGame = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Supprimer la partie actuelle
      await resetGame();
      
      // Nettoyer les états locaux
      setGameState(null);
      setGameEndMessage('');
      
      // Supprimer les informations du joueur du localStorage
      localStorage.removeItem('perudoPlayerId');
      localStorage.removeItem('perudoPlayerName');
      setPlayerId(null);
      setPlayerName(null);
      
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      setError('Erreur lors de la réinitialisation. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  // Si pas de playerId, afficher le formulaire de connexion
  if (!playerId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
        <div className="w-full max-w-md">
          <LoginForm onSubmit={handleJoinGame} initialName={playerName} />
          {isLoading && (
            <div className="mt-4 text-center">
              <div className="animate-pulse">Connexion en cours...</div>
            </div>
          )}
          {error && (
            <div className="mt-4 text-center text-red-500">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Si pas de gameState, afficher le chargement
  if (!gameState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
        <div>Chargement de la partie...</div>
      </div>
    );
  }

  // Si en attente, afficher la salle d'attente
  if (gameState?.status === 'waiting') {
    return (
      <WaitingRoom
        players={gameState.players || []}
        isHost={isHost}
        onStartGame={handleStartGame}
      />
    );
  }

  if (gameEndMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h2 className="text-3xl font-bold mb-8">{gameEndMessage}</h2>
        <div className="flex gap-4">
          <button
            onClick={handleResetGame}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded"
            disabled={isLoading}
          >
            {isLoading ? 'Réinitialisation...' : 'Nouvelle Partie'}
          </button>
        </div>
        {error && (
          <div className="mt-4 text-red-500">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Afficher le plateau de jeu
  return (
    <GameBoard
      gameState={gameState}
      playerId={playerId}
      onPlaceBid={handlePlaceBid}
      onDudo={handleDudo}
      onReset={handleResetGame}
    />
  );
}