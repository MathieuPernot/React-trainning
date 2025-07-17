import React from 'react';
import { useGame } from '../../context/GameContext';

// Composant pour afficher le statut du jeu
const GameStatus = () => {
  const { gameData, totalDice } = useGame();

  if (!gameData) return null;

  const { round, lastAction } = gameData;

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl">Tour {round || 1}</h2>
      <div className="text-sm mb-2">
        Total des dés en jeu: {totalDice}
      </div>
      
      {lastAction && lastAction.type === 'bid' && (
        <div className="mb-4 p-2 rounded bg-gray-800">
          <div className="text-sm text-gray-300">Dernière enchère:</div>
          <div className="text-lg">
            {lastAction.count} × {lastAction.value}
            {lastAction.isPalifico && (
              <span className="text-yellow-400 ml-2">(Palifico)</span>
            )}
          </div>
        </div>
      )}
      
      {lastAction && lastAction.type === 'challenge' && (
        <div className="mb-4 p-2 rounded bg-blue-800">
          <div className="text-sm text-gray-300">Résultat du dernier Dudo:</div>
          <div className="text-lg">
            {lastAction.actualCount} dés trouvés (enchère: {lastAction.targetCount})
          </div>
        </div>
      )}
      
      {lastAction && lastAction.type === 'calza' && (
        <div className="mb-4 p-2 rounded bg-yellow-800">
          <div className="text-sm text-gray-300">Résultat du dernier Calza:</div>
          <div className="text-lg">
            {lastAction.actualCount} dés trouvés 
            {lastAction.isCalzaCorrect ? (
              <span className="text-green-400 ml-2">✓ Correct!</span>
            ) : (
              <span className="text-red-400 ml-2">✗ Incorrect</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameStatus;