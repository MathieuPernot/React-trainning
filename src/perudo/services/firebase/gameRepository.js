// Pure Firebase operations for game data
import { doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import db from '../../backend/config';
import { FIREBASE_CONFIG } from '../../utils/constants';

const { GAME_COLLECTION, ROOM_ID } = FIREBASE_CONFIG;

// Référence du document de jeu
const getGameRef = () => doc(db, GAME_COLLECTION, ROOM_ID);

// Vérifier si une partie existe
export const gameExists = async () => {
  try {
    const gameRef = getGameRef();
    const gameDoc = await getDoc(gameRef);
    return gameDoc.exists();
  } catch (error) {
    console.error('Error checking game existence:', error);
    return false;
  }
};

// Récupérer les données de la partie
export const getGameData = async () => {
  try {
    const gameRef = getGameRef();
    const gameDoc = await getDoc(gameRef);
    return gameDoc.exists() ? gameDoc.data() : null;
  } catch (error) {
    console.error('Error fetching game data:', error);
    return null;
  }
};

// Créer une nouvelle partie
export const createGame = async (gameData) => {
  try {
    const gameRef = getGameRef();
    await setDoc(gameRef, {
      ...gameData,
      createdAt: new Date(),
      lastUpdate: new Date()
    });
    return gameData;
  } catch (error) {
    console.error('Error creating game:', error);
    throw new Error('Impossible de créer la partie');
  }
};

// Mettre à jour la partie
export const updateGame = async (updateData) => {
  try {
    const gameRef = getGameRef();
    await updateDoc(gameRef, {
      ...updateData,
      lastUpdate: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error updating game:', error);
    throw new Error('Impossible de mettre à jour la partie');
  }
};

// Supprimer la partie
export const deleteGame = async () => {
  try {
    const gameRef = getGameRef();
    await deleteDoc(gameRef);
    return true;
  } catch (error) {
    console.error('Error deleting game:', error);
    throw new Error('Impossible de supprimer la partie');
  }
};

// S'abonner aux changements de la partie
export const subscribeToGameChanges = (callback) => {
  const gameRef = getGameRef();
  
  return onSnapshot(gameRef, 
    (doc) => {
      try {
        if (doc.exists()) {
          const gameData = doc.data();
          callback(gameData);
        } else {
          callback(null);
        }
      } catch (error) {
        console.error('Error processing game update:', error);
        callback(null);
      }
    },
    (error) => {
      console.error('Error in game subscription:', error);
      // Ne pas appeler callback(null) pour éviter de perdre l'état
    }
  );
};