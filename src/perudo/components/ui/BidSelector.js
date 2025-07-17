import React, { useState, useEffect } from 'react';
import { useBidValidation } from '../../hooks/useBidValidation';
import { useGame } from '../../context/GameContext';
import Dice from '../Dice';
import Button from './Button';

// Composant pour sélectionner une enchère
const BidSelector = ({ onValidate, onCancel }) => {
  const { totalDice } = useGame();
  const {
    lastBid,
    isPalifico,
    validateBid,
    availableDiceValues,
    getAvailableCounts,
    getMinimumCount,
    getMaximumCount,
    autoSuggestedBid,
    ruleInfo
  } = useBidValidation();

  const [bidValue, setBidValue] = useState(2);
  const [bidCount, setBidCount] = useState(1);
  const [bidError, setBidError] = useState('');

  // Initialiser les valeurs en fonction de la suggestion automatique
  useEffect(() => {
    if (autoSuggestedBid) {
      setBidValue(autoSuggestedBid.diceValue);
      setBidCount(autoSuggestedBid.diceCount);
    } else if (availableDiceValues.length > 0) {
      const firstValue = availableDiceValues[0];
      setBidValue(firstValue);
      setBidCount(getMinimumCount(firstValue));
    }
  }, [autoSuggestedBid, availableDiceValues, getMinimumCount]);

  // Valider l'enchère en temps réel
  useEffect(() => {
    const validation = validateBid(bidValue, bidCount);
    setBidError(validation.isValid ? '' : validation.error);
  }, [bidValue, bidCount, validateBid]);

  // Gérer le changement de valeur de dé
  const handleValueChange = (newValue) => {
    setBidValue(newValue);
    // Ajuster automatiquement le nombre pour qu'il soit valide
    const minCount = getMinimumCount(newValue);
    if (bidCount < minCount) {
      setBidCount(minCount);
    }
  };

  // Gérer le changement de quantité
  const handleCountChange = (newCount) => {
    const maxCount = getMaximumCount(bidValue);
    const minCount = getMinimumCount(bidValue);
    setBidCount(Math.max(minCount, Math.min(maxCount, newCount)));
  };

  // Valider et envoyer l'enchère
  const handleValidate = () => {
    const validation = validateBid(bidValue, bidCount);
    if (validation.isValid) {
      onValidate(bidValue, bidCount);
    } else {
      setBidError(validation.error);
    }
  };

  const isValidCurrentBid = validateBid(bidValue, bidCount).isValid;
  const availableCounts = getAvailableCounts(bidValue);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-xl mb-4 text-center">Faire une enchère</h3>
        
        {/* Informations sur les règles actuelles */}
        <div className="mb-4 p-3 bg-gray-700 rounded text-sm">
          <div className="font-semibold mb-1">Règles actuelles:</div>
          <div className="text-gray-300">{ruleInfo.message}</div>
          {lastBid && (
            <div className="text-gray-400 mt-1">
              Dernière enchère: {lastBid.diceCount} × {lastBid.diceValue}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          {/* Sélecteur de quantité */}
          <div className="flex flex-col items-center">
            <label className="text-sm mb-2">Quantité</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCountChange(bidCount - 1)}
                disabled={bidCount <= getMinimumCount(bidValue)}
                className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center disabled:opacity-50"
              >
                -
              </button>
              <span className="w-12 text-center text-2xl font-bold">
                {bidCount}
              </span>
              <button
                onClick={() => handleCountChange(bidCount + 1)}
                disabled={bidCount >= getMaximumCount(bidValue)}
                className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>

          <div className="text-2xl">×</div>

          {/* Sélecteur de valeur de dé */}
          <div className="flex flex-col items-center">
            <label className="text-sm mb-2">Valeur</label>
            {isPalifico ? (
              // En mode Palifico, afficher seulement la valeur fixe
              <div className="w-16 h-16 flex items-center justify-center">
                <Dice number={bidValue} />
              </div>
            ) : (
              // Mode normal, permettre la sélection
              <div className="grid grid-cols-3 gap-1">
                {[1, 2, 3, 4, 5, 6].map(value => (
                  <button
                    key={value}
                    onClick={() => handleValueChange(value)}
                    disabled={!availableDiceValues.includes(value)}
                    className={`w-12 h-12 flex items-center justify-center rounded transition-colors ${
                      bidValue === value
                        ? 'bg-blue-600'
                        : availableDiceValues.includes(value)
                        ? 'bg-gray-600 hover:bg-gray-500'
                        : 'bg-gray-700 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Dice number={value} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Affichage des erreurs */}
        {bidError && (
          <div className="mb-4 p-2 bg-red-900 text-red-200 rounded text-sm text-center">
            {bidError}
          </div>
        )}

        {/* Suggestion automatique */}
        {autoSuggestedBid && (
          <div className="mb-4 p-2 bg-blue-900 text-blue-200 rounded text-sm text-center">
            Suggestion: {autoSuggestedBid.diceCount} × {autoSuggestedBid.diceValue}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={onCancel}
            style={{ backgroundColor: '#6b7280' }}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleValidate}
            disabled={!isValidCurrentBid}
            className="flex-1"
          >
            Confirmer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BidSelector;