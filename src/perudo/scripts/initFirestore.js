// Script d'initialisation de Firestore pour le jeu Perudo
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

// Configuration Firebase (même que dans config.js)
const firebaseConfig = {
  apiKey: "AIzaSyAwQ7P72aeLzyr9Q6frBiolOxHvNPQjglo",
  authDomain: "perudo-9b0e7.firebaseapp.com",
  projectId: "perudo-9b0e7",
  storageBucket: "perudo-9b0e7.firebasestorage.app",
  messagingSenderId: "254121531273",
  appId: "1:254121531273:web:be76e011742b3c62367358",
};

// Initialiser Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

const GAME_COLLECTION = 'games';
const ROOM_ID = 'game_default';

// Fonction pour nettoyer la base de données
async function cleanDatabase() {
  console.log('🧹 [Init] Cleaning existing data...');
  
  try {
    // Supprimer la collection games
    const gamesRef = collection(db, GAME_COLLECTION);
    const snapshot = await getDocs(gamesRef);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log('✅ [Init] Database cleaned successfully');
  } catch (error) {
    console.error('❌ [Init] Error cleaning database:', error);
  }
}

// Fonction pour initialiser la structure de base
async function initializeDatabase() {
  console.log('🏗️ [Init] Initializing Firestore structure...');
  
  try {
    // Créer un document exemple pour la collection games (optionnel)
    const metadataDoc = doc(db, GAME_COLLECTION, '_metadata');
    await setDoc(metadataDoc, {
      version: '1.0.0',
      description: 'Collection pour les parties de Perudo',
      createdAt: new Date(),
      structure: {
        roomId: ROOM_ID,
        fields: {
          status: 'waiting | playing | finished',
          createdBy: 'string (player ID)',
          currentPlayer: 'string (player ID)',
          lastAction: 'object { type, player, value, count, timestamp }',
          players: 'array of player objects',
          round: 'number',
          lastUpdate: 'timestamp',
          createdAt: 'timestamp',
          hostLastSeen: 'timestamp'
        }
      }
    });
    
    console.log('✅ [Init] Database structure initialized');
    console.log('📋 [Init] Collection created: games');
    console.log('📋 [Init] Default room ID: game_default');
    console.log('📋 [Init] Metadata document created');
    
  } catch (error) {
    console.error('❌ [Init] Error initializing database:', error);
    throw error;
  }
}

// Fonction pour créer une partie de test
async function createTestGame() {
  console.log('🎮 [Init] Creating test game...');
  
  try {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const testGameData = {
      status: 'waiting',
      createdBy: 'test_player_1',
      currentPlayer: null,
      lastAction: null,
      players: [{
        id: 'test_player_1',
        name: 'Joueur Test',
        diceCount: 5,
        dice: [1, 2, 3, 4, 5],
        isReady: false,
        lastSeen: new Date(),
        isCreator: true
      }],
      round: 1,
      lastUpdate: new Date(),
      createdAt: new Date(),
      hostLastSeen: new Date()
    };
    
    await setDoc(roomRef, testGameData);
    
    console.log('✅ [Init] Test game created successfully');
    console.log('📋 [Init] Test player: "Joueur Test"');
    console.log('📋 [Init] You can now test the application!');
    
  } catch (error) {
    console.error('❌ [Init] Error creating test game:', error);
    throw error;
  }
}

// Fonction pour vérifier la connexion
async function testConnection() {
  console.log('🔍 [Init] Testing Firestore connection...');
  
  try {
    const testDoc = doc(db, 'test', 'connection');
    await setDoc(testDoc, { timestamp: new Date() });
    
    const docSnapshot = await getDoc(testDoc);
    if (docSnapshot.exists()) {
      console.log('✅ [Init] Firestore connection successful');
      
      // Nettoyer le document de test
      await deleteDoc(testDoc);
      return true;
    } else {
      console.log('❌ [Init] Firestore connection failed');
      return false;
    }
  } catch (error) {
    console.error('❌ [Init] Firestore connection error:', error);
    return false;
  }
}

// Fonction pour afficher les informations sur la base de données
async function showDatabaseInfo() {
  console.log('📊 [Init] Database Information:');
  console.log('├── Project ID:', firebaseConfig.projectId);
  console.log('├── Collection:', GAME_COLLECTION);
  console.log('├── Default Room ID:', ROOM_ID);
  console.log('└── Auth Domain:', firebaseConfig.authDomain);
  
  try {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);
    
    if (roomDoc.exists()) {
      const data = roomDoc.data();
      console.log('📋 [Init] Current room status:', data.status);
      console.log('📋 [Init] Players count:', data.players?.length || 0);
      console.log('📋 [Init] Created by:', data.createdBy);
    } else {
      console.log('📋 [Init] No active room found');
    }
  } catch (error) {
    console.error('❌ [Init] Error reading database info:', error);
  }
}

// Fonction principale
async function main() {
  console.log('🚀 [Init] Starting Firestore initialization...');
  console.log('');
  
  try {
    // 1. Tester la connexion
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ [Init] Cannot connect to Firestore. Please check your configuration.');
      process.exit(1);
    }
    
    console.log('');
    
    // 2. Afficher les informations
    await showDatabaseInfo();
    
    console.log('');
    
    // 3. Demander quelle action effectuer
    const args = process.argv.slice(2);
    const action = args[0] || 'init';
    
    switch (action) {
      case 'clean':
        await cleanDatabase();
        break;
        
      case 'init':
        await initializeDatabase();
        break;
        
      case 'test':
        await createTestGame();
        break;
        
      case 'reset':
        await cleanDatabase();
        await initializeDatabase();
        console.log('🎯 [Init] Database reset complete - ready for first player to create lobby');
        break;
        
      case 'empty':
        await cleanDatabase();
        console.log('🎯 [Init] Database emptied - ready for first player to create lobby');
        break;
        
      default:
        console.log('');
        console.log('📖 [Init] Available commands:');
        console.log('├── node initFirestore.js init     - Initialize database structure');
        console.log('├── node initFirestore.js clean    - Clean existing data');
        console.log('├── node initFirestore.js test     - Create test game');
        console.log('├── node initFirestore.js empty    - Empty database (quick reset)');
        console.log('└── node initFirestore.js reset    - Full reset (clean + init, ready for first player)');
        break;
    }
    
    console.log('');
    console.log('✅ [Init] Initialization complete!');
    
  } catch (error) {
    console.error('❌ [Init] Initialization failed:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();