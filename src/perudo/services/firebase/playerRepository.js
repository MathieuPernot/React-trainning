// Player-specific Firebase operations
import { GAME_CONFIG } from '../../utils/constants';
import { generateDice } from '../../utils/helpers';
import { getGameData, updateGame } from './gameRepository';

// Validation des données joueur
const validatePlayer = (player) => {
  if (!player || typeof player !== 'object') {
    throw new Error('Données joueur invalides');
  }
  
  if (!player.id || typeof player.id !== 'string' || player.id.trim() === '') {
    throw new Error('ID de joueur invalide');
  }
  
  if (!player.name || typeof player.name !== 'string' || player.name.trim() === '') {
    throw new Error('Nom de joueur invalide');
  }
  
  if (player.name.length > 20) {
    throw new Error('Nom de joueur trop long (maximum 20 caractères)');
  }
  
  // Vérifier les caractères autorisés
  if (!/^[a-zA-Z0-9À-ſ\s-_]+$/.test(player.name)) {
    throw new Error('Nom de joueur contient des caractères non autorisés');
  }
};

// Ajouter un joueur à la partie
export const addPlayerToGame = async (player) => {
  validatePlayer(player);
  
  const gameData = await getGameData();
  if (!gameData) {
    throw new Error('Aucune partie trouvée');
  }
  
  // Vérifier s'il y a collision d'ID
  const existingPlayerWithSameId = gameData.players.find(p => p.id === player.id);
  if (existingPlayerWithSameId && existingPlayerWithSameId.name.toLowerCase() !== player.name.toLowerCase()) {
    console.warn('⚠️ ID collision detected! Same ID for different players:', {
      existing: existingPlayerWithSameId.name,
      new: player.name,
      id: player.id
    });
    throw new Error('Collision d\'ID détectée. Veuillez rafraîchir la page et réessayer.');
  }
  
  // Vérifier si le joueur existe déjà (reconnexion)
  const existingPlayerIndex = gameData.players.findIndex(p => 
    p.id === player.id || p.name.toLowerCase() === player.name.toLowerCase()
  );
  
  const now = new Date();
  
  if (existingPlayerIndex !== -1) {
    // Reconnexion du joueur existant
    const updatedPlayers = [...gameData.players];
    updatedPlayers[existingPlayerIndex] = {
      ...updatedPlayers[existingPlayerIndex],
      id: player.id,
      lastSeen: now,
      isConnected: true
    };
    
    await updateGame({ players: updatedPlayers });
    return { ...gameData, players: updatedPlayers };
  } else {
    // Nouveau joueur
    if (gameData.status === 'playing') {
      throw new Error('La partie est déjà en cours, impossible de rejoindre');
    }
    
    const newPlayer = {
      id: player.id,
      name: player.name,
      diceCount: GAME_CONFIG.INITIAL_DICE,
      dice: [],
      isReady: false,
      lastSeen: now,
      isCreator: false,
      isConnected: true
    };
    
    const updatedPlayers = [...gameData.players, newPlayer];
    await updateGame({ players: updatedPlayers });
    return { ...gameData, players: updatedPlayers };
  }
};

// Supprimer un joueur de la partie
export const removePlayerFromGame = async (playerId) => {
  const gameData = await getGameData();
  if (!gameData) {
    return { success: true, message: 'Aucune partie trouvée' };
  }
  
  const updatedPlayers = gameData.players.filter(p => p.id !== playerId);
  
  if (updatedPlayers.length === 0) {
    // Plus de joueurs, supprimer la partie
    const { deleteGame } = await import('./gameRepository');
    await deleteGame();
    return { success: true, message: 'Partie supprimée - plus de joueurs' };
  }
  
  await updateGame({ players: updatedPlayers });
  return { success: true, message: 'Joueur supprimé avec succès' };
};

// Marquer un joueur comme prêt/pas prêt
export const setPlayerReady = async (playerId, isReady = true) => {
  if (typeof isReady !== 'boolean') {
    throw new Error('Statut de prêt invalide');
  }
  
  const gameData = await getGameData();
  if (!gameData) {
    throw new Error('Partie non trouvée');
  }
  
  const now = new Date();
  const updatedPlayers = gameData.players.map(p => 
    p.id === playerId 
      ? { ...p, isReady, lastSeen: now }
      : p
  );
  
  const updateData = { players: updatedPlayers };
  
  // Mettre à jour hostLastSeen si c'est le créateur
  if (gameData.createdBy === playerId) {
    updateData.hostLastSeen = now;
  }
  
  await updateGame(updateData);
  return { success: true };
};

// Envoyer un heartbeat pour maintenir la connexion
export const sendPlayerHeartbeat = async (playerId) => {
  const gameData = await getGameData();
  if (!gameData) {
    return { success: false, message: 'Partie non trouvée' };
  }
  
  // Vérifier si le joueur existe encore dans la partie
  const playerExists = gameData.players.some(p => p.id === playerId);
  if (!playerExists) {
    return { success: false, message: 'Joueur non trouvé dans la partie' };
  }
  
  const now = new Date();
  const updatedPlayers = gameData.players.map(p => 
    p.id === playerId 
      ? { ...p, lastSeen: now, isConnected: true }
      : p
  );
  
  const updateData = { players: updatedPlayers };
  
  // Mettre à jour hostLastSeen si c'est le créateur
  if (gameData.createdBy === playerId) {
    updateData.hostLastSeen = now;
  }
  
  await updateGame(updateData);
  return { success: true };
};

// Distribuer les dés aux joueurs
export const distributeDiceToPlayers = async () => {
  const gameData = await getGameData();
  if (!gameData) {
    throw new Error('Partie non trouvée');
  }
  
  const updatedPlayers = gameData.players.map(player => ({
    ...player,
    dice: generateDice(player.diceCount)
  }));
  
  await updateGame({ players: updatedPlayers });
  return updatedPlayers;
};

// Nettoyer les joueurs inactifs
export const cleanupInactivePlayers = async () => {
  const gameData = await getGameData();
  if (!gameData) {
    return { success: true, message: 'Aucune partie à nettoyer' };
  }
  
  const now = new Date();
  const activePlayers = gameData.players.filter(player => {
    const lastSeen = player.lastSeen?.toDate?.() || new Date(player.lastSeen);
    return lastSeen && (now - lastSeen) < GAME_CONFIG.INACTIVE_TIMEOUT;
  });
  
  // Si le créateur n'est plus actif, supprimer la partie
  const creatorActive = activePlayers.some(p => p.id === gameData.createdBy);
  if (!creatorActive) {
    const { deleteGame } = await import('./gameRepository');
    await deleteGame();
    return { success: true, message: 'Partie supprimée - créateur inactif' };
  }
  
  // Mettre à jour avec les joueurs actifs seulement
  if (activePlayers.length !== gameData.players.length) {
    const removedCount = gameData.players.length - activePlayers.length;
    await updateGame({ players: activePlayers });
    return { success: true, message: `${removedCount} joueurs inactifs supprimés` };
  }
  
  return { success: true, message: 'Aucun nettoyage nécessaire' };
};