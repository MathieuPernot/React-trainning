import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { usePlayer } from '../../context/PlayerContext';
import { usePlayerActions } from '../../hooks/usePlayerActions';
import { useGameActions } from '../../hooks/useGameActions';
import Button from '../ui/Button';
import ErrorDisplay from '../ui/ErrorDisplay';
import DiceContainer from '../DiceContainer';
import BidSelector from '../BidSelector';
import GameStatus from './GameStatus';
import PlayerList from './PlayerList';
import GameEndScreen from './GameEndScreen';

// Composant pour les actions du joueur
const PlayerActions = ({ isMyTurn, canChallenge, canDeclareCalza, onPlaceBid, onChallenge, onCalza }) => {
  const [showBidSelector, setShowBidSelector] = useState(false);

  if (!isMyTurn) {
    return (
      <div className="text-center text-gray-400">
        En attente de votre tour...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4">
        <Button onClick={() => setShowBidSelector(true)}>
          Enchérir
        </Button>
        {canChallenge && (
          <Button 
            onClick={() => {
              setShowBidSelector(false);
              onChallenge();
            }}
            style={{ backgroundColor: '#dc2626' }}
          >
            Dudo!
          </Button>
        )}
        {canDeclareCalza && (
          <Button 
            onClick={() => {
              setShowBidSelector(false);
              onCalza();
            }}
            style={{ backgroundColor: '#f59e0b' }}
          >
            Calza!
          </Button>
        )}
      </div>
      
      {showBidSelector && (
        <BidSelector
          onValidate={(value, count) => {
            onPlaceBid(value, count);
            setShowBidSelector(false);
          }}
          onCancel={() => setShowBidSelector(false)}
        />
      )}
    </div>
  );
};

// Composant principal du plateau de jeu
const GameBoard = () => {
  const { gameData, isFinished, error, actions: gameActions } = useGame();
  const { playerId } = usePlayer();
  const { 
    isMyTurn, 
    currentPlayer, 
    isPalifico, 
    canChallenge, 
    canDeclareCalza,
    placeBid, 
    challengeBid, 
    declareCalza 
  } = usePlayerActions();
  const { resetGame } = useGameActions();

  // Si le jeu est terminé, afficher l'écran de fin
  if (isFinished) {
    return <GameEndScreen onNewGame={resetGame} />;
  }

  // Si pas de données de jeu ou de joueur
  if (!gameData || !currentPlayer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-white bg-gray-900">
        <div>Chargement du plateau de jeu...</div>
      </div>
    );
  }

  const handlePlaceBid = async (value, count) => {
    try {
      await placeBid(value, count);
    } catch (error) {
      console.error('Error placing bid:', error);
    }
  };

  const handleChallenge = async () => {
    try {
      await challengeBid();
    } catch (error) {
      console.error('Error challenging bid:', error);
    }
  };

  const handleCalza = async () => {
    try {
      await declareCalza();
    } catch (error) {
      console.error('Error declaring calza:', error);
    }
  };

  return (
    <div className="perudo-section min-h-screen p-4" style={{position: 'relative'}}>
      {/* Statut du jeu */}
      <GameStatus />
      
      {/* Mode Palifico indicator */}
      {isPalifico && (
        <div className="mb-4 p-2 rounded bg-yellow-800 text-yellow-200 text-center">
          🎯 Mode Palifico activé ! Les Paco ne sont plus des jokers.
        </div>
      )}

      {/* Dés du joueur */}
      <div className="mb-8">
        <h3 className="mb-2 text-lg">Vos dés:</h3>
        <DiceContainer diceList={currentPlayer.dice || []} />
      </div>

      {/* Actions du joueur */}
      <PlayerActions
        isMyTurn={isMyTurn}
        canChallenge={canChallenge}
        canDeclareCalza={canDeclareCalza}
        onPlaceBid={handlePlaceBid}
        onChallenge={handleChallenge}
        onCalza={handleCalza}
      />

      {/* Liste des joueurs */}
      <PlayerList />

      {/* Affichage des erreurs */}
      {error && (
        <ErrorDisplay 
          error={error} 
          onClose={() => gameActions.setError(null)} 
        />
      )}
    </div>
  );
};

export default GameBoard;