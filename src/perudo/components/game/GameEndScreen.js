import React from 'react';
import { useGame } from '../../context/GameContext';
import { usePlayer } from '../../context/PlayerContext';
import { getWinner } from '../../utils/helpers';
import Button from '../ui/Button';

// Composant pour l'écran de fin de partie
const GameEndScreen = ({ onNewGame }) => {
  const { gameData, players, isLoading } = useGame();
  const { playerId } = usePlayer();

  if (!gameData) return null;

  const winner = getWinner(players);
  const isCreator = gameData.createdBy === playerId;
  const isWinner = winner?.id === playerId;

  const handleNewGame = async () => {
    try {
      await onNewGame();
    } catch (error) {
      console.error('Error starting new game:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="text-center max-w-md">
        {/* Message de victoire */}
        <div className="mb-8">
          {winner ? (
            <>
              <h2 className="text-3xl font-bold mb-4">
                🎉 {winner.name} a gagné ! 🎉
              </h2>
              {isWinner && (
                <p className="text-xl text-green-400 mb-4">
                  Félicitations, vous avez gagné !
                </p>
              )}
            </>
          ) : (
            <h2 className="text-3xl font-bold mb-4">
              Partie terminée
            </h2>
          )}
        </div>

        {/* Statistiques de la partie */}
        <div className="mb-8 p-4 bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Résultats finaux</h3>
          <div className="space-y-2">
            {players
              .sort((a, b) => (b.diceCount || 0) - (a.diceCount || 0))
              .map((player, index) => (
                <div key={player.id} className="flex justify-between items-center">
                  <span className={`${player.id === playerId ? 'font-bold text-blue-400' : ''}`}>
                    {index + 1}. {player.name}
                    {player.id === playerId && ' (Vous)'}
                  </span>
                  <span className={player.diceCount > 0 ? 'text-green-400' : 'text-red-400'}>
                    {player.diceCount || 0} dés
                    {player.diceCount > 0 && index === 0 && ' 👑'}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Informations sur la partie */}
        <div className="mb-6 text-sm text-gray-400">
          <p>Tour final: {gameData.round}</p>
          <p>Durée de la partie: {Math.floor((new Date() - new Date(gameData.createdAt)) / 60000)} minutes</p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          {isCreator && (
            <Button
              onClick={handleNewGame}
              disabled={isLoading}
              className="px-6 py-3"
            >
              {isLoading ? 'Création...' : 'Nouvelle Partie'}
            </Button>
          )}
          
          <Button
            onClick={() => window.location.reload()}
            style={{ backgroundColor: '#6b7280' }}
            className="px-6 py-3"
          >
            Retour au lobby
          </Button>
        </div>

        {!isCreator && (
          <p className="mt-4 text-sm text-gray-400">
            Seul le créateur peut lancer une nouvelle partie
          </p>
        )}
      </div>
    </div>
  );
};

export default GameEndScreen;