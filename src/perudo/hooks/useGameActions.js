import { useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { usePlayer } from '../context/PlayerContext';
import { addPlayerToGame } from '../services/firebase/playerRepository';
import { createGame, updateGame, deleteGame } from '../services/firebase/gameRepository';
import { startNewGame, canStartGame } from '../services/gameLogic/gameRules';
import { GAME_STATUS, GAME_CONFIG } from '../utils/constants';

// Hook pour les actions du jeu (créer, démarrer, etc.)
export const useGameActions = () => {
  const { gameData, actions } = useGame();
  const { playerId } = usePlayer();

  // Créer ou rejoindre un lobby
  const joinOrCreateLobby = useCallback(async (player, onIdCollision = null) => {
    try {
      actions.setLoading(true);
      actions.setError(null);

      console.log('🚀 [useGameActions] Joining or creating lobby for:', player.name);
      
      // Essayer d'ajouter le joueur à une partie existante
      try {
        const updatedGameData = await addPlayerToGame(player);
        console.log('✅ [useGameActions] Successfully joined existing game');
        return updatedGameData;
      } catch (error) {
        // Gérer la collision d'ID
        if (error.message.includes('Collision d\'ID détectée')) {
          console.warn('⚠️ [useGameActions] ID collision detected');
          
          if (onIdCollision) {
            // Callback pour gérer la collision depuis le composant
            throw new Error('ID_COLLISION_RETRY_NEEDED');
          } else {
            throw new Error('Collision d\'ID détectée. Veuillez rafraîchir la page et réessayer.');
          }
        }
        
        // Si aucune partie n'existe, en créer une nouvelle
        if (error.message === 'Aucune partie trouvée') {
          console.log('🏗️ [useGameActions] Creating new game');
          
          const newGameData = {
            status: GAME_STATUS.WAITING,
            createdBy: player.id,
            currentPlayer: null,
            lastAction: null,
            players: [{
              id: player.id,
              name: player.name,
              diceCount: GAME_CONFIG.INITIAL_DICE,
              dice: [],
              isReady: false,
              lastSeen: new Date(),
              isCreator: true,
              isConnected: true
            }],
            round: 1,
            hostLastSeen: new Date()
          };
          
          const createdGame = await createGame(newGameData);
          console.log('✅ [useGameActions] New game created successfully');
          return createdGame;
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ [useGameActions] Error in joinOrCreateLobby:', error);
      actions.setError(error.message || 'Erreur lors de la connexion au lobby');
      throw error;
    } finally {
      actions.setLoading(false);
    }
  }, [actions]);

  // Démarrer la partie
  const startGame = useCallback(async () => {
    if (!gameData || !playerId) {
      throw new Error('Données de jeu ou joueur manquantes');
    }

    try {
      actions.setLoading(true);
      actions.setError(null);

      console.log('🎮 [useGameActions] Starting game...');
      
      // Vérifier si le jeu peut être démarré
      const validation = canStartGame(gameData, playerId);
      if (!validation.canStart) {
        throw new Error(validation.reason);
      }

      // Démarrer le jeu avec la logique métier
      const updatedGameData = startNewGame(gameData, playerId);
      
      // Sauvegarder en base
      await updateGame(updatedGameData);
      
      console.log('✅ [useGameActions] Game started successfully');
    } catch (error) {
      console.error('❌ [useGameActions] Error starting game:', error);
      actions.setError(error.message || 'Impossible de démarrer la partie');
      throw error;
    } finally {
      actions.setLoading(false);
    }
  }, [gameData, playerId, actions]);

  // Annuler la partie
  const cancelGame = useCallback(async () => {
    if (!gameData || !playerId) {
      throw new Error('Données de jeu ou joueur manquantes');
    }

    if (gameData.createdBy !== playerId) {
      throw new Error('Seul le créateur peut annuler la partie');
    }

    try {
      actions.setLoading(true);
      actions.setError(null);

      console.log('❌ [useGameActions] Canceling game...');
      
      await deleteGame();
      actions.resetGame();
      
      console.log('✅ [useGameActions] Game canceled successfully');
    } catch (error) {
      console.error('❌ [useGameActions] Error canceling game:', error);
      actions.setError(error.message || 'Impossible d\'annuler la partie');
      throw error;
    } finally {
      actions.setLoading(false);
    }
  }, [gameData, playerId, actions]);

  // Réinitialiser la partie
  const resetGame = useCallback(async () => {
    if (!gameData || !playerId) {
      throw new Error('Données de jeu ou joueur manquantes');
    }

    if (gameData.createdBy !== playerId) {
      throw new Error('Seul le créateur peut réinitialiser la partie');
    }

    try {
      actions.setLoading(true);
      actions.setError(null);

      console.log('🔄 [useGameActions] Resetting game...');
      
      await deleteGame();
      actions.resetGame();
      
      console.log('✅ [useGameActions] Game reset successfully');
    } catch (error) {
      console.error('❌ [useGameActions] Error resetting game:', error);
      actions.setError(error.message || 'Impossible de réinitialiser la partie');
      throw error;
    } finally {
      actions.setLoading(false);
    }
  }, [gameData, playerId, actions]);

  // Vérifier si le joueur est le créateur
  const isCreator = gameData?.createdBy === playerId;

  // Vérifier si tous les joueurs sont prêts
  const allPlayersReady = gameData?.players?.length >= GAME_CONFIG.MIN_PLAYERS && 
                         gameData?.players?.every(p => p.isReady);

  return {
    joinOrCreateLobby,
    startGame,
    cancelGame,
    resetGame,
    isCreator,
    allPlayersReady,
    canStartGame: allPlayersReady && isCreator
  };
};