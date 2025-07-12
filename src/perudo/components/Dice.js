import React from 'react';

const dotLayouts = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const Dice = ({ number }) => {
  const parsedNumber = parseInt(number);

  // ✅ Vérification explicite du nombre
  if (isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > 6) {
    throw new Error(`Le numéro du dé doit être un entier entre 1 et 6. Reçu: ${number}`);
  }

  const activeDots = dotLayouts[parsedNumber];

  return (
    <div className="perudo-dice">
      {[...Array(9)].map((_, i) => (
        <span
          key={i}
          className={`perudo-dot${activeDots.includes(i) ? '' : ' inactive'}`}
        />
      ))}
    </div>
  );
};

export default Dice;
