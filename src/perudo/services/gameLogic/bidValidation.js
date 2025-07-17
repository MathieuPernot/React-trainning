// Pure business logic for bid validation
import { GAME_CONFIG } from '../../utils/constants';

// Validation des données d'enchère
export const validateBidData = (bid) => {
  if (!bid || typeof bid !== 'object') {
    throw new Error('Enchère invalide');
  }
  
  const { diceValue, diceCount } = bid;
  
  if (!Number.isInteger(diceValue) || diceValue < GAME_CONFIG.MIN_DICE_VALUE || diceValue > GAME_CONFIG.MAX_DICE_VALUE) {
    throw new Error(`Valeur de dé invalide (doit être entre ${GAME_CONFIG.MIN_DICE_VALUE} et ${GAME_CONFIG.MAX_DICE_VALUE})`);
  }
  
  if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > GAME_CONFIG.MAX_BID_COUNT) {
    throw new Error(`Nombre de dés invalide (doit être entre 1 et ${GAME_CONFIG.MAX_BID_COUNT})`);
  }
  
  return true;
};

// Validation d'une enchère selon les règles du jeu
export const isValidBid = (currentBid, lastBid, isPalifico = false) => {
  // Valider d'abord les données
  validateBidData(currentBid);
  
  // S'il n'y a pas d'enchère précédente, toute enchère est valide
  if (!lastBid) return { isValid: true };

  const currentValue = currentBid.diceValue;
  const lastValue = lastBid.diceValue;
  const currentCount = currentBid.diceCount;
  const lastCount = lastBid.diceCount;

  // En mode Palifico, seule la quantité peut augmenter avec la même valeur
  if (isPalifico) {
    if (currentValue !== lastValue) {
      return { 
        isValid: false, 
        error: `En mode Palifico, vous ne pouvez enchérir que sur des ${lastValue}` 
      };
    }
    if (currentCount <= lastCount) {
      return { 
        isValid: false, 
        error: `En mode Palifico, vous devez annoncer plus de ${lastCount} dés` 
      };
    }
    return { isValid: true };
  }

  // Cas spécial : passage aux Paco
  if (lastValue !== 1 && currentValue === 1) {
    const minRequired = Math.ceil(lastCount / 2);
    if (currentCount < minRequired) {
      return { 
        isValid: false, 
        error: `Pour passer aux Paco (1), il faut au moins ${minRequired} dés` 
      };
    }
    return { isValid: true };
  }

  // Cas spécial : enchère après les Paco
  if (lastValue === 1 && currentValue !== 1) {
    const minRequired = (lastCount * 2) + 1;
    if (currentCount < minRequired) {
      return { 
        isValid: false, 
        error: `Pour sortir des Paco (1), il faut au moins ${minRequired} dés` 
      };
    }
    return { isValid: true };
  }

  // Même valeur de dé
  if (currentValue === lastValue) {
    if (currentCount <= lastCount) {
      return { 
        isValid: false, 
        error: `Avec la même valeur (${currentValue}), vous devez annoncer plus de ${lastCount} dés` 
      };
    }
    return { isValid: true };
  }

  // Valeur de dé différente
  if (currentValue > lastValue) {
    if (currentCount < lastCount) {
      return { 
        isValid: false, 
        error: `Avec une valeur supérieure (${currentValue}), vous devez annoncer au moins ${lastCount} dés` 
      };
    }
    return { isValid: true };
  }

  // Si la valeur est inférieure, il faut augmenter le nombre de dés
  if (currentValue < lastValue) {
    if (currentCount <= lastCount) {
      return { 
        isValid: false, 
        error: `Avec une valeur inférieure (${currentValue}), vous devez annoncer plus de ${lastCount} dés` 
      };
    }
    return { isValid: true };
  }

  return { isValid: false, error: 'Enchère invalide' };
};

// Obtenir les enchères valides possibles
export const getValidBidOptions = (lastBid, totalDice, isPalifico = false) => {
  const validBids = [];
  
  if (!lastBid) {
    // Première enchère, toutes les combinaisons sont valides
    for (let value = 1; value <= GAME_CONFIG.MAX_DICE_VALUE; value++) {
      for (let count = 1; count <= totalDice; count++) {
        validBids.push({ diceValue: value, diceCount: count });
      }
    }
    return validBids;
  }
  
  const lastValue = lastBid.diceValue;
  const lastCount = lastBid.diceCount;
  
  if (isPalifico) {
    // En Palifico, seule la quantité peut augmenter avec la même valeur
    for (let count = lastCount + 1; count <= totalDice; count++) {
      validBids.push({ diceValue: lastValue, diceCount: count });
    }
    return validBids;
  }
  
  // Générer toutes les enchères valides possibles
  for (let value = 1; value <= GAME_CONFIG.MAX_DICE_VALUE; value++) {
    for (let count = 1; count <= totalDice; count++) {
      const bid = { diceValue: value, diceCount: count };
      const validation = isValidBid(bid, lastBid, isPalifico);
      if (validation.isValid) {
        validBids.push(bid);
      }
    }
  }
  
  return validBids;
};

// Suggérer une enchère automatique (pour les timeouts)
export const suggestAutoBid = (lastBid, totalDice, isPalifico = false) => {
  const validBids = getValidBidOptions(lastBid, totalDice, isPalifico);
  
  if (validBids.length === 0) {
    return null; // Aucune enchère possible, doit faire un Dudo
  }
  
  // Choisir une enchère conservative (la plus petite valide)
  validBids.sort((a, b) => {
    if (a.diceValue !== b.diceValue) {
      return a.diceValue - b.diceValue;
    }
    return a.diceCount - b.diceCount;
  });
  
  return validBids[0];
};