import React from 'react';

const Player = ({ name, diceCount, bet, isCurrentTurn = false }) => {
  const [quantity, face] = bet || [0, 0];

  return (
    <div className="flex flex-col justify-between w-32 h-32 p-2 text-sm border border-gray-400">
      <div className="font-bold truncate">{name}</div>
      <div>Dés : {diceCount}</div>
      {isCurrentTurn && (
        <div>Enchère : {quantity > 0 ? `${quantity}×${face}` : '—'}</div>
      )}
    </div>
  );
};

export default Player;
