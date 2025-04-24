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
    <div className="relative w-16 h-16 bg-white">
      {[...Array(9)].map((_, i) => (
        <span
          key={i}
          className={`absolute w-3 h-3 bg-black rounded-full transition-all duration-200 ${
            activeDots.includes(i) ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            top: `${Math.floor(i / 3) * 33}%`,
            left: `${(i % 3) * 33}%`,
            transform: 'translate(50%, 50%)',
          }}
        />
      ))}
    </div>
  );
};

export default Dice;
