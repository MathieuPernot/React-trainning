import { useEffect, useRef } from 'react';
import { subscribeToGameChanges } from '../services/firebase/gameRepository';
import { useGame } from '../context/GameContext';

// Hook pour gérer la subscription Firebase du jeu
export const useGameSubscription = () => {
  const { actions } = useGame();
  const subscriptionRef = useRef(null);

  useEffect(() => {
    console.log('🔄 [useGameSubscription] Setting up game subscription...');
    
    // S'abonner aux changements du jeu
    subscriptionRef.current = subscribeToGameChanges((gameData) => {
      console.log('📡 [useGameSubscription] Game data updated:', gameData ? 'exists' : 'null');
      actions.setGameState(gameData);
    });

    // Cleanup à la destruction
    return () => {
      console.log('🔄 [useGameSubscription] Cleaning up game subscription');
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [actions]);

  // Fonction pour forcer une reconnexion
  const reconnect = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current();
    }
    
    subscriptionRef.current = subscribeToGameChanges((gameData) => {
      actions.setGameState(gameData);
    });
  };

  return { reconnect };
};