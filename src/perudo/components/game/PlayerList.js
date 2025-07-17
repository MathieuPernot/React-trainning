import React from 'react';
import { useGame } from '../../context/GameContext';

// Composant pour afficher un joueur individuel
const PlayerItem = ({ player, isCurrentTurn, isCurrentPlayer }) => {
  return (
    <div
      className={`p-2 rounded flex items-center justify-between ${
        isCurrentTurn ? 'bg-yellow-800 text-yellow-200' : 'bg-gray-800'
      } ${
        isCurrentPlayer ? 'border-2 border-blue-500' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={isCurrentTurn ? 'font-bold' : ''}>
          {player.name}
        </span>
        {player.isCreator && (
          <span className="text-yellow-400 text-sm">👑</span>
        )}
        {isCurrentPlayer && (
          <span className="text-blue-400 text-sm">(Vous)</span>
        )}
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <span>{player.diceCount || 0} dés</span>
        {player.diceCount === 1 && (
          <span className="text-yellow-400">🎯</span>
        )}
        {player.diceCount === 0 && (
          <span className="text-red-400">❌</span>
        )}
      </div>
    </div>
  );
};

// Composant pour afficher la liste des joueurs
const PlayerList = () => {
  const { gameData, players } = useGame();

  if (!gameData || !players.length) {
    return null;
  }

  const currentTurnPlayerId = gameData.currentPlayer;

  return (
    <div className="mt-8">
      <h3 className="mb-2 text-lg">Joueurs:</h3>
      <div className="space-y-2">
        {players.map(player => (
          <PlayerItem
            key={player.id}
            player={player}
            isCurrentTurn={currentTurnPlayerId === player.id}
            isCurrentPlayer={false} // Will be set by parent if needed
          />
        ))}
      </div>
      
      {gameData.status === 'playing' && currentTurnPlayerId && (
        <div className="mt-2 text-sm text-gray-400">
          Tour de: {players.find(p => p.id === currentTurnPlayerId)?.name || 'Inconnu'}
        </div>
      )}
    </div>
  );
};

export default PlayerList;