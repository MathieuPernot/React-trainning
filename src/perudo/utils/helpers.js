import { GAME_CONFIG } from './constants';

// Fonction utilitaire pour valider une enchère
export const isValidBid = (currentBid, lastBid, isPalifico = false) => {
  // S'il n'y a pas d'enchère précédente, toute enchère est valide
  if (!lastBid) return true;

  const currentValue = currentBid.diceValue;
  const lastValue = lastBid.diceValue;
  const currentCount = currentBid.diceCount;
  const lastCount = lastBid.diceCount;

  // En mode Palifico, seule la quantité peut augmenter avec la même valeur
  if (isPalifico) {
    return currentValue === lastValue && currentCount > lastCount;
  }

  // Cas spécial : passage aux Paco
  if (lastValue !== 1 && currentValue === 1) {
    // Pour passer aux Paco, il faut au moins la moitié (arrondi supérieur) du nombre précédent
    return currentCount >= Math.ceil(lastCount / 2);
  }

  // Cas spécial : enchère après les Paco
  if (lastValue === 1 && currentValue !== 1) {
    // Pour sortir des Paco, il faut au moins le double + 1
    return currentCount >= (lastCount * 2) + 1;
  }

  // Même valeur de dé
  if (currentValue === lastValue) {
    return currentCount > lastCount;
  }

  // Valeur de dé différente
  if (currentValue > lastValue) {
    // On peut garder le même nombre de dés si la valeur est supérieure
    return currentCount >= lastCount;
  }

  // Si la valeur est inférieure, il faut augmenter le nombre de dés
  if (currentValue < lastValue) {
    return currentCount > lastCount;
  }

  return false;
};

// Fonction pour calculer le nombre de dés correspondant à une valeur
export const countMatchingDice = (players, targetValue, isPalifico = false) => {
  let count = 0;
  
  players.forEach(player => {
    if (player.dice) {
      player.dice.forEach(die => {
        if (isPalifico) {
          // En mode Palifico, les Paco ne sont pas des jokers
          if (die === targetValue) {
            count++;
          }
        } else {
          // Mode normal : les Paco sont des jokers
          if (die === targetValue || (die === 1 && targetValue !== 1)) {
            count++;
          }
        }
      });
    }
  });
  
  return count;
};

// Fonction pour générer de nouveaux dés pour un joueur
export const generateDice = (count) => {
  return Array(count).fill(0).map(() => Math.floor(Math.random() * GAME_CONFIG.MAX_DICE_VALUE) + 1);
};

// Fonction pour déterminer le prochain joueur actif
export const getNextActivePlayer = (players, currentPlayerIndex) => {
  const activePlayers = players.filter(p => p.diceCount > 0);
  if (activePlayers.length <= 1) return null;
  
  const currentPlayer = players[currentPlayerIndex];
  const currentActiveIndex = activePlayers.findIndex(p => p.id === currentPlayer.id);
  
  if (currentActiveIndex === -1) {
    // Le joueur actuel n'a plus de dés, prendre le premier joueur actif
    return activePlayers[0];
  }
  
  const nextActiveIndex = (currentActiveIndex + 1) % activePlayers.length;
  return activePlayers[nextActiveIndex];
};

// Fonction pour vérifier si le jeu est terminé
export const isGameOver = (players) => {
  const activePlayers = players.filter(p => p.diceCount > 0);
  return activePlayers.length <= 1;
};

// Fonction pour obtenir le gagnant
export const getWinner = (players) => {
  const activePlayers = players.filter(p => p.diceCount > 0);
  return activePlayers.length === 1 ? activePlayers[0] : null;
};

// Fonction pour formater le temps
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Fonction pour obtenir un message d'erreur de validation d'enchère
export const getBidErrorMessage = (currentBid, lastBid, isPalifico = false) => {
  if (!lastBid) return null;
  
  const { diceValue: currentValue, diceCount: currentCount } = currentBid;
  const { diceValue: lastValue, diceCount: lastCount } = lastBid;
  
  if (isPalifico && currentValue !== lastValue) {
    return `En mode Palifico, vous ne pouvez enchérir que sur des ${lastValue}`;
  }
  
  if (lastValue === 1 && currentValue !== 1) {
    const minRequired = (lastCount * 2) + 1;
    if (currentCount < minRequired) {
      return `Pour sortir des Paco (1), il faut au moins ${minRequired} dés`;
    }
  }
  
  if (lastValue !== 1 && currentValue === 1) {
    const minRequired = Math.ceil(lastCount / 2);
    if (currentCount < minRequired) {
      return `Pour passer aux Paco (1), il faut au moins ${minRequired} dés`;
    }
  }
  
  if (currentValue === lastValue && currentCount <= lastCount) {
    return `Avec la même valeur (${currentValue}), vous devez annoncer plus de ${lastCount} dés`;
  }
  
  if (currentValue > lastValue && currentCount < lastCount) {
    return `Avec une valeur supérieure (${currentValue}), vous devez annoncer au moins ${lastCount} dés`;
  }
  
  if (currentValue < lastValue && currentCount <= lastCount) {
    return `Avec une valeur inférieure (${currentValue}), vous devez annoncer plus de ${lastCount} dés`;
  }
  
  return 'Enchère invalide';
};