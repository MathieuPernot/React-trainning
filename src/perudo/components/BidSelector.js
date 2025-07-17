import React, { useState, useEffect } from 'react';
import Dice from './Dice';
import Button from './Button';

const BidSelector = ({ lastBid, totalDice, onValidate, onCancel, isPalifico = false }) => {
  const [bidValue, setBidValue] = useState(2);
  const [bidCount, setBidCount] = useState(1);
  const [bidError, setBidError] = useState('');

  // Initialiser les valeurs en fonction de la dernière enchère
  useEffect(() => {
    if (lastBid) {
      if (isPalifico) {
        // En mode Palifico, on garde la même valeur
        setBidValue(lastBid.diceValue);
        setBidCount(lastBid.diceCount + 1);
      } else {
        // Logique normale
        if (lastBid.diceValue === 1) {
          // Sortir des Paco
          setBidValue(2);
          setBidCount((lastBid.diceCount * 2) + 1);
        } else {
          setBidValue(lastBid.diceValue);
          setBidCount(lastBid.diceCount + 1);
        }
      }
    }
  }, [lastBid, isPalifico]);

  // Fonction de validation des enchères (même logique que côté serveur)
  const isValidBid = (currentBid, lastBid) => {
    if (!lastBid) return true;

    const currentValue = currentBid.diceValue;
    const lastValue = lastBid.diceValue;
    const currentCount = currentBid.diceCount;
    const lastCount = lastBid.diceCount;

    // En mode Palifico, seule la quantité peut augmenter avec la même valeur
    if (isPalifico) {
      return currentValue === lastValue && currentCount > lastCount;
    }

    // Passage aux Paco (1)
    if (lastValue !== 1 && currentValue === 1) {
      return currentCount >= Math.ceil(lastCount / 2);
    }

    // Sortie des Paco
    if (lastValue === 1 && currentValue !== 1) {
      return currentCount >= (lastCount * 2) + 1;
    }

    // Même valeur de dé
    if (currentValue === lastValue) {
      return currentCount > lastCount;
    }

    // Valeur supérieure
    if (currentValue > lastValue) {
      return currentCount >= lastCount;
    }

    // Valeur inférieure
    if (currentValue < lastValue) {
      return currentCount > lastCount;
    }

    return false;
  };

  // Validation de l'enchère avant de l'envoyer
  const validateAndPlaceBid = () => {
    const currentBid = { diceValue: bidValue, diceCount: bidCount };
    
    // Vérifications de base
    if (bidCount < 1 || bidValue < 1 || bidValue > 6) {
      setBidError('Enchère invalide : valeurs hors limites.');
      return;
    }

    if (bidCount > totalDice) {
      setBidError(`Impossible d'enchérir sur plus de ${totalDice} dés (total en jeu).`);
      return;
    }

    // Validation selon les règles du Perudo
    if (lastBid && !isValidBid(currentBid, lastBid)) {
      if (isPalifico) {
        setBidError(`En mode Palifico, vous devez enchérir sur plus de ${lastBid.diceCount} dés de valeur ${lastBid.diceValue}.`);
      } else if (lastBid.diceValue === 1) {
        setBidError(`Pour sortir des Paco (1), il faut au moins ${(lastBid.diceCount * 2) + 1} dés.`);
      } else if (bidValue === 1) {
        setBidError(`Pour passer aux Paco (1), il faut au moins ${Math.ceil(lastBid.diceCount / 2)} dés.`);
      } else if (bidValue === lastBid.diceValue && bidCount <= lastBid.diceCount) {
        setBidError(`Avec la même valeur (${bidValue}), vous devez annoncer plus de ${lastBid.diceCount} dés.`);
      } else if (bidValue > lastBid.diceValue && bidCount < lastBid.diceCount) {
        setBidError(`Avec une valeur supérieure (${bidValue}), vous devez annoncer au moins ${lastBid.diceCount} dés.`);
      } else if (bidValue < lastBid.diceValue && bidCount <= lastBid.diceCount) {
        setBidError(`Avec une valeur inférieure (${bidValue}), vous devez annoncer plus de ${lastBid.diceCount} dés.`);
      }
      return;
    }

    setBidError('');
    onValidate(bidValue, bidCount);
  };

  return (
    <div className="perudo-section perudo-bidselector-modal">
      <h3 className="perudo-label" style={{textAlign: 'center'}}>Nouvelle enchère</h3>
      <div className="perudo-bidselector-fields">
        <div className="perudo-bidselector-field">
          <label className="perudo-bidselector-label">Valeur du dé</label>
          <div className="perudo-bidselector-dice-row">
            <Button 
              type="button" 
              onClick={() => setBidValue(Math.max(1, bidValue - 1))} 
              style={{width: '1.6rem', height: '1.6rem', padding: 0}}
              disabled={isPalifico}
            >-</Button>
            <Dice number={bidValue} />
            <Button 
              type="button" 
              onClick={() => setBidValue(Math.min(6, bidValue + 1))} 
              style={{width: '1.6rem', height: '1.6rem', padding: 0}}
              disabled={isPalifico}
            >+</Button>
          </div>
          {isPalifico && (
            <div className="text-sm text-yellow-400 mt-1">
              Mode Palifico : valeur fixée à {bidValue}
            </div>
          )}
        </div>
        <div className="perudo-bidselector-field">
          <label className="perudo-bidselector-label">Nombre de dés</label>
          <div className="perudo-bidselector-dice-row">
            <Button type="button" onClick={() => setBidCount(Math.max(1, bidCount - 1))} style={{width: '1.6rem', height: '1.6rem', padding: 0}}>-</Button>
            <span style={{fontSize: '1.5rem', minWidth: '2.5rem', textAlign: 'center'}}>{bidCount}</span>
            <Button type="button" onClick={() => setBidCount(Math.min(totalDice, bidCount + 1))} style={{width: '1.6rem', height: '1.6rem', padding: 0}}>+</Button>
          </div>
        </div>
      </div>
      {bidError && <div className="perudo-bidselector-error">{bidError}</div>}
      <div className="perudo-bidselector-actions">
        <Button onClick={validateAndPlaceBid}>Valider</Button>
        <Button onClick={onCancel} style={{background: 'var(--perudo-light-grey)'}}>Annuler</Button>
      </div>
    </div>
  );
};

export default BidSelector; 