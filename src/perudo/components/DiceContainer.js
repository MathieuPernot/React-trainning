import React from 'react';
import Dice from './dice'; // Assure-toi que le chemin est correct selon ta structure

const DiceContainer = ({ diceList = [] }) => {
  // On s'assure que le tableau contient au max 5 éléments valides entre 1 et 6
  const sanitizedDice = diceList
    .slice(0, 5)
    .map(d => Math.min(Math.max(parseInt(d) || 1, 1), 6));

  return (
    <div className="flex gap-4 p-4 bg-gray-800 rounded-lg shadow-md">
      {sanitizedDice.length === 0 ? (
        <p className="text-white">Aucun dé</p>
      ) : (
        sanitizedDice.map((number, index) => (
          <Dice key={index} number={number} />
        ))
      )}
    </div>
  );
};

export default DiceContainer;
