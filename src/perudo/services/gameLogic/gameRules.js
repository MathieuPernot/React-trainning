// Pure business logic for Perudo game rules
import { GAME_CONFIG, GAME_STATUS, ACTION_TYPES } from '../../utils/constants';
import { generateDice, getNextActivePlayer, isGameOver, getWinner, countMatchingDice } from '../../utils/helpers';

// Vérifier si un joueur peut démarrer la partie
export const canStartGame = (gameData, playerId) => {
  if (!gameData || gameData.status !== GAME_STATUS.WAITING) {
    return { canStart: false, reason: 'La partie n\'est pas en attente' };
  }
  
  if (gameData.createdBy !== playerId) {
    return { canStart: false, reason: 'Seul le créateur peut démarrer la partie' };
  }
  
  if (gameData.players.length < GAME_CONFIG.MIN_PLAYERS) {
    return { canStart: false, reason: `Il faut au moins ${GAME_CONFIG.MIN_PLAYERS} joueurs` };
  }
  
  const readyPlayers = gameData.players.filter(p => p.isReady);
  if (readyPlayers.length < gameData.players.length) {
    return { canStart: false, reason: 'Tous les joueurs ne sont pas prêts' };
  }
  
  return { canStart: true };
};

// Démarrer une nouvelle partie
export const startNewGame = (gameData, creatorId) => {
  const validation = canStartGame(gameData, creatorId);
  if (!validation.canStart) {
    throw new Error(validation.reason);
  }
  
  // Distribuer les dés aux joueurs
  const players = gameData.players.map(player => ({
    ...player,
    dice: generateDice(GAME_CONFIG.INITIAL_DICE),
    diceCount: GAME_CONFIG.INITIAL_DICE
  }));
  
  // Déterminer le premier joueur aléatoirement
  const startingPlayerIndex = Math.floor(Math.random() * players.length);
  const now = new Date();
  
  return {
    ...gameData,
    status: GAME_STATUS.PLAYING,
    players,
    currentPlayer: players[startingPlayerIndex].id,
    round: 1,
    lastAction: {
      type: ACTION_TYPES.GAME_START,
      player: creatorId,
      timestamp: now
    },
    lastUpdate: now,
    hostLastSeen: now
  };
};

// Vérifier si c'est le tour d'un joueur
export const isPlayerTurn = (gameData, playerId) => {
  if (!gameData || gameData.status !== GAME_STATUS.PLAYING) {
    return false;
  }
  return gameData.currentPlayer === playerId;
};

// Vérifier si un joueur est en mode Palifico
export const isPlayerInPalifico = (gameData, playerId) => {
  if (!gameData || !gameData.players) {
    return false;
  }
  
  const player = gameData.players.find(p => p.id === playerId);
  return player && player.diceCount === 1;
};

// Placer une enchère
export const placeBid = (gameData, playerId, bid) => {
  if (!isPlayerTurn(gameData, playerId)) {
    throw new Error('Ce n\'est pas votre tour');
  }
  
  if (gameData.status !== GAME_STATUS.PLAYING) {
    throw new Error('La partie n\'est pas en cours');
  }
  
  const currentPlayer = gameData.players.find(p => p.id === playerId);
  if (!currentPlayer) {
    throw new Error('Joueur non trouvé');
  }
  
  const isPalifico = currentPlayer.diceCount === 1;
  
  // La validation est faite dans bidValidation.js
  const activePlayers = gameData.players.filter(p => p.diceCount > 0);
  const nextPlayer = getNextActivePlayer(gameData.players, activePlayers.findIndex(p => p.id === playerId));
  
  if (!nextPlayer) {
    throw new Error('Aucun joueur suivant trouvé');
  }
  
  const now = new Date();
  const updatedPlayers = gameData.players.map(p => 
    p.id === playerId ? { ...p, lastSeen: now } : p
  );
  
  return {
    ...gameData,
    players: updatedPlayers,
    currentPlayer: nextPlayer.id,
    lastAction: {
      type: ACTION_TYPES.BID,
      player: playerId,
      value: bid.diceValue,
      count: bid.diceCount,
      isPalifico: isPalifico,
      timestamp: now
    },
    lastUpdate: now,
    ...(gameData.createdBy === playerId && { hostLastSeen: now })
  };
};

// Contester une enchère (Dudo)
export const challengeBid = (gameData, challengerId) => {
  if (!isPlayerTurn(gameData, challengerId)) {
    throw new Error('Ce n\'est pas votre tour');
  }
  
  if (!gameData.lastAction || gameData.lastAction.type !== ACTION_TYPES.BID) {
    throw new Error('Aucune enchère à contester');
  }
  
  const diceValue = gameData.lastAction.value;
  const targetCount = gameData.lastAction.count;
  const isPalifico = gameData.lastAction.isPalifico;
  
  // Compter les dés correspondants
  const actualCount = countMatchingDice(gameData.players, diceValue, isPalifico);
  
  // Déterminer le perdant
  const challengedPlayerId = gameData.lastAction.player;
  const losingPlayerId = actualCount >= targetCount ? challengerId : challengedPlayerId;
  
  // Mettre à jour les dés du perdant
  const updatedPlayers = gameData.players.map(player => {
    if (player.id === losingPlayerId) {
      const newDiceCount = Math.max(0, player.diceCount - 1);
      return {
        ...player,
        diceCount: newDiceCount,
        dice: newDiceCount > 0 ? generateDice(newDiceCount) : []
      };
    }
    // Régénérer les dés pour tous les autres joueurs
    if (player.diceCount > 0) {
      return {
        ...player,
        dice: generateDice(player.diceCount)
      };
    }
    return player;
  });
  
  // Vérifier si le jeu est terminé
  const gameEnded = isGameOver(updatedPlayers);
  
  // Déterminer le prochain tour
  let nextPlayerTurn = losingPlayerId;
  if (gameEnded) {
    nextPlayerTurn = null;
  } else {
    const losingPlayer = updatedPlayers.find(p => p.id === losingPlayerId);
    if (losingPlayer && losingPlayer.diceCount === 0) {
      // Le joueur qui a perdu n'a plus de dés, passer au suivant
      const nextPlayer = getNextActivePlayer(updatedPlayers, 
        updatedPlayers.findIndex(p => p.id === losingPlayerId)
      );
      nextPlayerTurn = nextPlayer ? nextPlayer.id : null;
    }
  }
  
  const now = new Date();
  
  return {
    ...gameData,
    players: updatedPlayers,
    status: gameEnded ? GAME_STATUS.FINISHED : GAME_STATUS.PLAYING,
    currentPlayer: nextPlayerTurn,
    round: gameData.round + 1,
    lastAction: {
      type: ACTION_TYPES.CHALLENGE,
      player: challengerId,
      challengedPlayer: challengedPlayerId,
      actualCount,
      targetCount,
      losingPlayerId,
      timestamp: now
    },
    lastUpdate: now,
    challengeResult: {
      challengerId,
      challengedId: challengedPlayerId,
      actualCount,
      targetCount,
      losingPlayerId,
      isGameOver: gameEnded,
      winner: gameEnded ? getWinner(updatedPlayers) : null
    }
  };
};

// Déclarer Calza (enchère exacte)
export const declareCalza = (gameData, playerId) => {
  if (!isPlayerTurn(gameData, playerId)) {
    throw new Error('Ce n\'est pas votre tour');
  }
  
  if (!gameData.lastAction || gameData.lastAction.type !== ACTION_TYPES.BID) {
    throw new Error('Aucune enchère pour déclarer Calza');
  }
  
  const diceValue = gameData.lastAction.value;
  const targetCount = gameData.lastAction.count;
  const isPalifico = gameData.lastAction.isPalifico;
  
  // Compter les dés correspondants
  const actualCount = countMatchingDice(gameData.players, diceValue, isPalifico);
  
  // Déterminer si le Calza est correct
  const isCalzaCorrect = actualCount === targetCount;
  
  // Mettre à jour les dés du joueur qui a déclaré Calza
  const updatedPlayers = gameData.players.map(player => {
    if (player.id === playerId) {
      if (isCalzaCorrect) {
        // Le joueur récupère un dé s'il a raison (max 5)
        const newDiceCount = Math.min(player.diceCount + 1, GAME_CONFIG.INITIAL_DICE);
        return {
          ...player,
          diceCount: newDiceCount,
          dice: generateDice(newDiceCount)
        };
      } else {
        // Le joueur perd un dé s'il a tort
        const newDiceCount = Math.max(0, player.diceCount - 1);
        return {
          ...player,
          diceCount: newDiceCount,
          dice: newDiceCount > 0 ? generateDice(newDiceCount) : []
        };
      }
    }
    // Régénérer les dés pour tous les autres joueurs
    if (player.diceCount > 0) {
      return {
        ...player,
        dice: generateDice(player.diceCount)
      };
    }
    return player;
  });
  
  // Vérifier si le jeu est terminé
  const gameEnded = isGameOver(updatedPlayers);
  
  // Déterminer le prochain tour
  let nextPlayerTurn = playerId;
  if (gameEnded) {
    nextPlayerTurn = null;
  } else {
    const calzaPlayer = updatedPlayers.find(p => p.id === playerId);
    if (calzaPlayer && calzaPlayer.diceCount === 0) {
      const nextPlayer = getNextActivePlayer(updatedPlayers, 
        updatedPlayers.findIndex(p => p.id === playerId)
      );
      nextPlayerTurn = nextPlayer ? nextPlayer.id : null;
    }
  }
  
  const now = new Date();
  
  return {
    ...gameData,
    players: updatedPlayers,
    status: gameEnded ? GAME_STATUS.FINISHED : GAME_STATUS.PLAYING,
    currentPlayer: nextPlayerTurn,
    round: gameData.round + 1,
    lastAction: {
      type: ACTION_TYPES.CALZA,
      player: playerId,
      actualCount,
      targetCount,
      isCalzaCorrect,
      timestamp: now
    },
    lastUpdate: now,
    calzaResult: {
      playerId,
      actualCount,
      targetCount,
      isCalzaCorrect,
      isGameOver: gameEnded,
      winner: gameEnded ? getWinner(updatedPlayers) : null
    }
  };
};

// Réinitialiser la partie
export const resetGame = () => {
  return null; // Supprime complètement la partie
};