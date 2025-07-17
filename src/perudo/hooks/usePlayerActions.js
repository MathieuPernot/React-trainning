import { useCallback, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { usePlayer } from '../context/PlayerContext';
import { setPlayerReady, sendPlayerHeartbeat } from '../services/firebase/playerRepository';
import { updateGame } from '../services/firebase/gameRepository';
import { placeBid as placeBidLogic, challengeBid as challengeBidLogic, declareCalza as declareCalzaLogic } from '../services/gameLogic/gameRules';
import { isValidBid } from '../services/gameLogic/bidValidation';
import { GAME_CONFIG } from '../utils/constants';

// Hook pour les actions du joueur (enchérir, défier, etc.)
export const usePlayerActions = () => {
  const { gameData, actions } = useGame();
  const { playerId } = usePlayer();
  const heartbeatRef = useRef(null);

  // Démarrer le heartbeat pour maintenir la connexion
  useEffect(() => {
    if (playerId && gameData?.status === 'playing') {
      // Clear existing heartbeat
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      
      heartbeatRef.current = setInterval(() => {
        sendPlayerHeartbeat(playerId).catch(console.error);
      }, GAME_CONFIG.HEARTBEAT_INTERVAL);
      
      return () => {
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
      };
    }
  }, [playerId, gameData?.status]);

  // Cleanup du heartbeat
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, []);

  // Marquer le joueur comme prêt/pas prêt
  const toggleReady = useCallback(async (isReady) => {
    if (!playerId) {
      throw new Error('ID de joueur manquant');
    }

    try {
      actions.setError(null);
      console.log(`🔄 [usePlayerActions] Setting player ready status: ${isReady}`);
      
      await setPlayerReady(playerId, isReady);
      
      console.log('✅ [usePlayerActions] Player ready status updated');
    } catch (error) {
      console.error('❌ [usePlayerActions] Error updating ready status:', error);
      actions.setError(`Erreur: ${error.message || 'Impossible de changer le statut'}`);
      throw error;
    }
  }, [playerId, actions]);

  // Placer une enchère
  const placeBid = useCallback(async (diceValue, diceCount) => {
    if (!playerId || !gameData) {
      throw new Error('Données manquantes pour placer l\'enchère');
    }

    // Validation côté client
    if (!diceValue || !diceCount || diceValue < 1 || diceValue > 6 || diceCount < 1) {
      throw new Error('Enchère invalide: valeur entre 1-6 et quantité minimale de 1');
    }

    try {
      actions.setLoading(true);
      actions.setError(null);

      console.log(`🎯 [usePlayerActions] Placing bid: ${diceCount} × ${diceValue}`);
      
      const bid = { diceValue, diceCount };
      
      // Validation avec la logique métier
      const currentPlayer = gameData.players.find(p => p.id === playerId);
      const isPalifico = currentPlayer?.diceCount === 1;
      const lastBid = gameData.lastAction?.type === 'bid' ? {
        diceValue: gameData.lastAction.value,
        diceCount: gameData.lastAction.count
      } : null;
      
      const validation = isValidBid(bid, lastBid, isPalifico);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Appliquer la logique métier
      const updatedGameData = placeBidLogic(gameData, playerId, bid);
      
      // Sauvegarder en base
      await updateGame(updatedGameData);
      
      console.log('✅ [usePlayerActions] Bid placed successfully');
    } catch (error) {
      console.error('❌ [usePlayerActions] Error placing bid:', error);
      const errorMessage = error.message || 'Erreur lors du placement de l\'enchère';
      actions.setError(errorMessage);
      throw error;
    } finally {
      actions.setLoading(false);
    }
  }, [playerId, gameData, actions]);

  // Contester une enchère (Dudo)
  const challengeBid = useCallback(async () => {
    if (!playerId || !gameData) {
      throw new Error('Données manquantes pour contester l\'enchère');
    }

    try {
      actions.setError(null);
      console.log('⚔️ [usePlayerActions] Challenging bid...');
      
      // Appliquer la logique métier
      const updatedGameData = challengeBidLogic(gameData, playerId);
      
      // Sauvegarder en base
      await updateGame(updatedGameData);
      
      console.log('✅ [usePlayerActions] Bid challenged successfully');
    } catch (error) {
      console.error('❌ [usePlayerActions] Error challenging bid:', error);
      actions.setError(`Erreur lors du challenge: ${error.message || 'Action impossible'}`);
      throw error;
    }
  }, [playerId, gameData, actions]);

  // Déclarer Calza
  const declareCalza = useCallback(async () => {
    if (!playerId || !gameData) {
      throw new Error('Données manquantes pour déclarer Calza');
    }

    try {
      actions.setError(null);
      console.log('🎯 [usePlayerActions] Declaring Calza...');
      
      // Appliquer la logique métier
      const updatedGameData = declareCalzaLogic(gameData, playerId);
      
      // Sauvegarder en base
      await updateGame(updatedGameData);
      
      console.log('✅ [usePlayerActions] Calza declared successfully');
    } catch (error) {
      console.error('❌ [usePlayerActions] Error declaring Calza:', error);
      actions.setError(`Erreur lors du Calza: ${error.message || 'Action impossible'}`);
      throw error;
    }
  }, [playerId, gameData, actions]);

  // Envoyer un heartbeat manuel
  const sendHeartbeat = useCallback(async () => {
    if (!playerId) return;
    
    try {
      await sendPlayerHeartbeat(playerId);
    } catch (error) {
      console.error('❌ [usePlayerActions] Error sending heartbeat:', error);
    }
  }, [playerId]);

  // Vérifier si c'est le tour du joueur
  const isMyTurn = gameData?.currentPlayer === playerId;

  // Obtenir les informations du joueur actuel
  const currentPlayer = gameData?.players?.find(p => p.id === playerId);

  // Vérifier si le joueur est en mode Palifico
  const isPalifico = currentPlayer?.diceCount === 1;

  // Vérifier si une enchère peut être contestée
  const canChallenge = isMyTurn && gameData?.lastAction?.type === 'bid';

  // Vérifier si Calza peut être déclaré
  const canDeclareCalza = isMyTurn && gameData?.lastAction?.type === 'bid';

  return {
    toggleReady,
    placeBid,
    challengeBid,
    declareCalza,
    sendHeartbeat,
    isMyTurn,
    currentPlayer,
    isPalifico,
    canChallenge,
    canDeclareCalza
  };
};