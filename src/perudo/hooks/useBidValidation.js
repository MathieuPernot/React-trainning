import { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { usePlayer } from '../context/PlayerContext';
import { isValidBid, getValidBidOptions, suggestAutoBid } from '../services/gameLogic/bidValidation';

// Hook pour la validation d'enchères
export const useBidValidation = () => {
  const { gameData, totalDice } = useGame();
  const { playerId } = usePlayer();

  // Obtenir la dernière enchère
  const lastBid = useMemo(() => {
    if (gameData?.lastAction?.type === 'bid') {
      return {
        diceValue: gameData.lastAction.value,
        diceCount: gameData.lastAction.count
      };
    }
    return null;
  }, [gameData?.lastAction]);

  // Vérifier si le joueur est en mode Palifico
  const isPalifico = useMemo(() => {
    if (!gameData?.players || !playerId) return false;
    const player = gameData.players.find(p => p.id === playerId);
    return player?.diceCount === 1;
  }, [gameData?.players, playerId]);

  // Valider une enchère spécifique
  const validateBid = useMemo(() => (diceValue, diceCount) => {
    if (!diceValue || !diceCount) {
      return { isValid: false, error: 'Valeurs manquantes' };
    }

    const bid = { diceValue, diceCount };
    return isValidBid(bid, lastBid, isPalifico);
  }, [lastBid, isPalifico]);

  // Obtenir toutes les enchères valides possibles
  const validBidOptions = useMemo(() => {
    if (!totalDice) return [];
    return getValidBidOptions(lastBid, totalDice, isPalifico);
  }, [lastBid, totalDice, isPalifico]);

  // Obtenir une suggestion d'enchère automatique
  const autoSuggestedBid = useMemo(() => {
    if (!totalDice) return null;
    return suggestAutoBid(lastBid, totalDice, isPalifico);
  }, [lastBid, totalDice, isPalifico]);

  // Vérifier si des enchères sont possibles
  const canMakeBid = validBidOptions.length > 0;

  // Obtenir les valeurs de dés disponibles
  const availableDiceValues = useMemo(() => {
    const values = new Set();
    validBidOptions.forEach(bid => values.add(bid.diceValue));
    return Array.from(values).sort((a, b) => a - b);
  }, [validBidOptions]);

  // Obtenir les quantités disponibles pour une valeur donnée
  const getAvailableCounts = useMemo(() => (diceValue) => {
    const counts = new Set();
    validBidOptions
      .filter(bid => bid.diceValue === diceValue)
      .forEach(bid => counts.add(bid.diceCount));
    return Array.from(counts).sort((a, b) => a - b);
  }, [validBidOptions]);

  // Obtenir le minimum requis pour une valeur donnée
  const getMinimumCount = useMemo(() => (diceValue) => {
    const validCounts = getAvailableCounts(diceValue);
    return validCounts.length > 0 ? Math.min(...validCounts) : 1;
  }, [getAvailableCounts]);

  // Obtenir le maximum possible pour une valeur donnée
  const getMaximumCount = useMemo(() => (diceValue) => {
    const validCounts = getAvailableCounts(diceValue);
    return validCounts.length > 0 ? Math.max(...validCounts) : totalDice;
  }, [getAvailableCounts, totalDice]);

  // Vérifier si une valeur spécifique est disponible
  const isDiceValueAvailable = useMemo(() => (diceValue) => {
    return availableDiceValues.includes(diceValue);
  }, [availableDiceValues]);

  // Obtenir un message d'erreur explicatif pour une enchère invalide
  const getErrorMessage = useMemo(() => (diceValue, diceCount) => {
    const validation = validateBid(diceValue, diceCount);
    return validation.error || null;
  }, [validateBid]);

  // Informations sur les règles actuelles
  const ruleInfo = useMemo(() => {
    if (!lastBid) {
      return {
        type: 'first_bid',
        message: 'Première enchère : toutes les combinaisons sont possibles'
      };
    }

    if (isPalifico) {
      return {
        type: 'palifico',
        message: `Mode Palifico : vous ne pouvez enchérir que sur des ${lastBid.diceValue} avec une quantité supérieure à ${lastBid.diceCount}`
      };
    }

    if (lastBid.diceValue === 1) {
      return {
        type: 'after_paco',
        message: `Après des Paco : il faut au moins ${(lastBid.diceCount * 2) + 1} dés pour sortir des Paco`
      };
    }

    return {
      type: 'normal',
      message: 'Règles normales : enchère supérieure requise'
    };
  }, [lastBid, isPalifico]);

  return {
    lastBid,
    isPalifico,
    validateBid,
    validBidOptions,
    autoSuggestedBid,
    canMakeBid,
    availableDiceValues,
    getAvailableCounts,
    getMinimumCount,
    getMaximumCount,
    isDiceValueAvailable,
    getErrorMessage,
    ruleInfo
  };
};