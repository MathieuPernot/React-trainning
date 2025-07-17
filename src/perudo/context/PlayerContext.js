import React, { createContext, useContext, useState, useEffect } from 'react';
import { generatePlayerId, getSavedPlayerName, savePlayerName, forceNewDeviceId, getDeviceIdInfo } from '../utils/deviceId';

const PlayerContext = createContext();

// Provider du contexte joueur
export const PlayerProvider = ({ children }) => {
  const [playerId, setPlayerId] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Charger les informations sauvegardées au démarrage
  useEffect(() => {
    const savedName = getSavedPlayerName();
    if (savedName) {
      setPlayerName(savedName);
      const generatedId = generatePlayerId(savedName);
      setPlayerId(generatedId);
    }
  }, []);

  // Actions du joueur
  const actions = {
    // Connexion du joueur
    connectPlayer: (name) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error('Le nom du joueur est requis');
      }
      
      const generatedId = generatePlayerId(trimmedName);
      setPlayerId(generatedId);
      setPlayerName(trimmedName);
      setIsConnected(true);
      savePlayerName(trimmedName);
      
      return generatedId;
    },

    // Déconnexion du joueur
    disconnectPlayer: () => {
      setIsConnected(false);
      // On garde l'ID et le nom pour une éventuelle reconnexion
    },

    // Mise à jour du nom
    updatePlayerName: (name) => {
      const trimmedName = name.trim();
      setPlayerName(trimmedName);
      if (trimmedName) {
        savePlayerName(trimmedName);
        // Régénérer l'ID si le nom change
        const newId = generatePlayerId(trimmedName);
        setPlayerId(newId);
        return newId;
      }
    },

    // Reset complet
    resetPlayer: () => {
      setPlayerId(null);
      setPlayerName('');
      setIsConnected(false);
    },

    // Forcer un nouvel ID en cas de collision
    forceNewId: (name) => {
      console.log('🔄 Forcing new device ID due to collision');
      forceNewDeviceId(); // Supprime l'ancien ID du localStorage
      const newId = generatePlayerId(name || playerName);
      setPlayerId(newId);
      console.log('✅ New ID generated:', newId);
      return newId;
    },

    // Debug: obtenir les informations d'ID
    getIdInfo: () => {
      return getDeviceIdInfo();
    }
  };

  // Valeurs dérivées
  const derivedValues = {
    hasValidPlayer: Boolean(playerId && playerName),
    isReady: isConnected && Boolean(playerId && playerName)
  };

  const value = {
    playerId,
    playerName,
    isConnected,
    ...derivedValues,
    actions
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};

// Hook pour utiliser le contexte du joueur
export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};