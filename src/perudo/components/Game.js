import React, { useState, useEffect } from 'react';
import Button from './Button';
import {
  subscribeToGame,
  startGame,
  placeBid,
  challengeBid,
  resetGame,
  setPlayerReady,
  cancelGame
} from '../backend/gameService';
import DiceContainer from './DiceContainer';
import Dice from './Dice';
import BidSelector from './BidSelector';


// Composant pour la salle d'attente (lobby)
const WaitingRoom = ({ players = [], isCreator, playerId, onStartGame, onCancel, onToggleReady }) => {
  const currentPlayer = players.find(p => p.id === playerId);
  const allPlayersReady = players.length >= 2 && players.every(p => p.isReady);
  
  console.log('🏠 [WaitingRoom] Rendering lobby with:', {
    playersCount: players.length,
    isCreator,
    currentPlayerReady: currentPlayer?.isReady,
    allPlayersReady
  });
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
      <h2 className="mb-4 text-2xl">🏠 Lobby Perudo</h2>
      <div className="mb-6 p-4 bg-gray-800 rounded-lg">
        <h3 className="mb-2 text-lg">Joueurs connectés ({players.length})</h3>
        {Array.isArray(players) && players.map(player => (
          <div key={player.id} className="mb-2 flex items-center gap-2">
            {player.name} 
            {player.isCreator && <span className="text-yellow-400">👑 Créateur</span>}
            {player.isReady ? (
              <span className="text-green-400">✓ Prêt</span>
            ) : (
              <span className="text-red-400">✗ Pas prêt</span>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex flex-col gap-2">
        {/* Bouton pour se marquer prêt/pas prêt */}
        <Button
          onClick={() => onToggleReady(!currentPlayer?.isReady)}
          style={{ 
            backgroundColor: currentPlayer?.isReady ? '#dc2626' : '#16a34a' 
          }}
        >
          {currentPlayer?.isReady ? 'Pas prêt' : 'Prêt'}
        </Button>
        
        {/* Boutons pour le créateur */}
        {isCreator && (
          <>
            <Button
              onClick={onStartGame}
              disabled={!allPlayersReady}
              style={{ 
                backgroundColor: allPlayersReady ? '#16a34a' : '#6b7280' 
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
      
      {players.length < 2 && (
        <div className="mt-4 text-sm text-gray-400">
          En attente d'autres joueurs... (min 2 joueurs)
        </div>
      )}
      
      {players.length >= 2 && !allPlayersReady && (
        <div className="mt-4 text-sm text-gray-400">
          En attente que tous les joueurs soient prêts...
        </div>
      )}
    </div>
  );
};

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
  const [showBidSelector, setShowBidSelector] = useState(false);
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
  const isCurrentTurn = gameState.currentPlayer === playerId;
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
    <div className="perudo-section" style={{position: 'relative'}}>
      <div className="mb-8">
        <h2 className="mb-4 text-xl">Tour {gameState.round || 1}</h2>
        <div className="text-sm mb-2">
          Total des dés en jeu: {totalDice}
        </div>
        {currentPlayer.diceCount === 1 && (
          <div className="mb-4 p-2 rounded bg-yellow-800 text-yellow-200">
            🎯 Mode Palifico activé ! Les Paco ne sont plus des jokers.
          </div>
        )}
        {gameState.lastAction && gameState.lastAction.type === 'bid' && (
          <div className="mb-4 p-2 rounded">
            Dernière enchère: {gameState.lastAction.count} × {gameState.lastAction.value}
            {gameState.lastAction.isPalifico && (
              <span className="text-yellow-400 ml-2">(Palifico)</span>
            )}
          </div>
        )}
      </div>
      <div className="mb-8">
        <h3 className="mb-2 text-lg">Vos dés:</h3>
        <DiceContainer diceList={currentPlayer.dice || []} />
      </div>

      {isCurrentTurn && (
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4">
            <Button onClick={() => setShowBidSelector(true)}>Enchérir</Button>
            {gameState.lastAction && gameState.lastAction.type === 'bid' && (
              <Button onClick={() => {
                setShowBidSelector(false);
                onDudo();
              }}>Dudo!</Button>
            )}
          </div>
          {showBidSelector && (
            <BidSelector
              lastBid={gameState.lastAction && gameState.lastAction.type === 'bid' ? {
                diceValue: gameState.lastAction.value,
                diceCount: gameState.lastAction.count,
                isPalifico: gameState.lastAction.isPalifico
              } : null}
              totalDice={totalDice}
              isPalifico={currentPlayer.diceCount === 1}
              onValidate={(value, count) => {
                onPlaceBid(value, count);
                setShowBidSelector(false);
              }}
              onCancel={() => setShowBidSelector(false)}
            />
          )}
        </div>
      )}

      <div className="mt-8">
        <h3 className="mb-2 text-lg">Joueurs:</h3>
        {gameState.players.map(player => (
          <div
            key={player.id}
            className={gameState.currentPlayer === player.id ? 'text-yellow-400' : ''}
          >
            {player.name} ({player.diceCount || 0} dés)
          </div>
        ))}
      </div>

      {gameState.status === 'finished' && gameState.createdBy === playerId && (
        <Button
          onClick={onReset}
          className="mt-8"
        >
          Nouvelle partie
        </Button>
      )}
    </div>
  );
};

export default function Game({ gameData: initialGameData, playerId: propPlayerId, playerName: propPlayerName }) {
  const [gameState, setGameState] = useState(initialGameData || null);
  const [playerId, setPlayerId] = useState(propPlayerId || null);
  const [playerName, setPlayerName] = useState(propPlayerName || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gameEndMessage, setGameEndMessage] = useState('');
  const [timer, setTimer] = useState(null);
  const [heartbeatInterval, setHeartbeatInterval] = useState(null);
  const TURN_TIMEOUT = 30000; // 30 secondes
  const HEARTBEAT_INTERVAL = 30000; // 30 secondes

  // Nettoyer les intervals au démontage
  useEffect(() => {
    return () => {
      // Nettoyer les intervals
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [heartbeatInterval, timer]);

  // Gérer le heartbeat pour maintenir la connexion
  useEffect(() => {
    if (playerId && !heartbeatInterval) {
      const interval = setInterval(() => {
        sendHeartbeat(playerId).catch(console.error);
      }, HEARTBEAT_INTERVAL);
      
      setHeartbeatInterval(interval);
      
      return () => clearInterval(interval);
    }
  }, [playerId, heartbeatInterval, HEARTBEAT_INTERVAL]);

  // Effet pour gérer le timer du tour
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing') {
      if (timer) {
        clearTimeout(timer);
        setTimer(null);
      }
      return;
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Si c'est le tour du joueur actuel, démarrer le timer
    if (gameState.currentPlayer === playerId) {
      // Nettoyer l'ancien timer si il existe
      if (timer) {
        clearTimeout(timer);
      }
      
      // Créer un nouveau timer
      const newTimer = setTimeout(async () => {
        try {
          // Si c'est le premier tour, placer une enchère aléatoire
          if (!gameState.lastAction || gameState.lastAction.type !== 'bid') {
            const randomValue = Math.floor(Math.random() * 6) + 1;
            await handlePlaceBid(randomValue, 1);
          } else {
            // Sinon, faire un Dudo
            await handleDudo();
          }
        } catch (error) {
          console.error('Erreur lors du timeout:', error);
        }
      }, TURN_TIMEOUT);
      
      setTimer(newTimer);
      
      // Nettoyer le timer quand le composant est démonté ou quand le tour change
      return () => {
        clearTimeout(newTimer);
      };
    }
  }, [gameState?.currentPlayerIndex, playerId, gameState?.status]);

  useEffect(() => {
    // S'abonner aux mises à jour du jeu
    console.log('🎮 [Game] Setting up game subscription...');
    const unsubscribe = subscribeToGame((newGameState) => {
      console.log('🎮 [Game] Game state updated:', newGameState ? 'exists' : 'null');
      setGameState(newGameState);
    });

    return () => {
      console.log('🎮 [Game] Cleaning up game subscription');
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


  const handleStartGame = async () => {
    try {
      setIsLoading(true);
      await startGame(playerId);
    } catch (error) {
      console.error('Erreur lors du démarrage:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelGame = async () => {
    try {
      setIsLoading(true);
      await cancelGame(playerId);
    } catch (error) {
      console.error('Erreur lors de l\'annulation:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleReady = async (isReady) => {
    try {
      await setPlayerReady(playerId, isReady);
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      setError(error.message);
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
  // Si pas d'ID de joueur, c'est un problème de configuration
  if (!playerId) {
    console.log('🎮 [Game] No playerId provided');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
        <div className="text-red-500">Erreur: Aucun ID de joueur fourni</div>
      </div>
    );
  }

  // Si pas de gameState, afficher le chargement
  if (!gameState) {
    console.log('🎮 [Game] No gameState, showing loading');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
        <div>Chargement du lobby...</div>
      </div>
    );
  }

  // Si en attente, afficher la salle d'attente (lobby)
  if (gameState?.status === 'waiting') {
    const isCreator = gameState.createdBy === playerId;
    console.log('🎮 [Game] Showing lobby, isCreator:', isCreator);
    return (
      <WaitingRoom
        players={gameState.players || []}
        isCreator={isCreator}
        playerId={playerId}
        onStartGame={handleStartGame}
        onCancel={handleCancelGame}
        onToggleReady={handleToggleReady}
      />
    );
  }

  if (gameEndMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h2 className="text-3xl font-bold mb-8">{gameEndMessage}</h2>
        <div className="flex gap-4">
          <Button
            onClick={handleResetGame}
            disabled={isLoading}
            className="px-4 py-2"
          >
            {isLoading ? 'Réinitialisation...' : 'Nouvelle Partie'}
          </Button>
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