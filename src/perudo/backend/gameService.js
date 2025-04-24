// src/firebase/gameService.js
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove } from 'firebase/firestore';
import db from './config';

const GAME_COLLECTION = 'games';
const ROOM_ID = 'perudo-room';

// Vérifie si une room existe
export const checkRoomExists = async () => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);
    return roomDoc.exists();
};

// Crée une nouvelle room
export const createRoom = async (hostPlayer) => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const gameData = {
        createdAt: new Date(),
        status: 'waiting', // waiting, playing, finished
        hostId: hostPlayer.id,
        players: [hostPlayer],
        currentTurn: null,
        lastBid: null,
        round: 0,
        gameLog: []
    };

    await setDoc(roomRef, gameData);
    return gameData;
};


// Rejoindre une room existante
export const joinRoom = async (player) => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
        throw new Error('Room not found');
    }

    const roomData = roomDoc.data();
    const playerExists = roomData.players.some(p => p.id === player.id);

    if (playerExists) {
        // Le joueur est déjà dans la room, mise à jour de ses informations
        await updateDoc(roomRef, {
            players: roomData.players.map(p => p.id === player.id ? { ...p, isConnected: true } : p)
        });
    } else {
        // Ajouter le nouveau joueur à la room
        await updateDoc(roomRef, {
            players: arrayUnion(player)
        });
    }

    return roomDoc.data();
};

// Déconnexion d'un joueur
export const disconnectPlayer = async (playerId) => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
        return;
    }

    const roomData = roomDoc.data();
    await updateDoc(roomRef, {
        players: roomData.players.map(p => p.id === playerId ? { ...p, isConnected: false } : p)
    });
};

// Démarrer la partie
export const startGame = async (playerIds) => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
        throw new Error('Room not found');
    }

    // Distribuer les dés aux joueurs
    const players = roomDoc.data().players.map(player => {
        return {
            ...player,
            dice: Array(5).fill(0).map(() => Math.floor(Math.random() * 6) + 1),
            diceCount: 5
        };
    });

    // Déterminer le premier joueur
    const startingPlayerIndex = Math.floor(Math.random() * players.length);

    await updateDoc(roomRef, {
        status: 'playing',
        players,
        currentTurn: players[startingPlayerIndex].id,
        round: 1,
        lastBid: null
    });

    return roomDoc.data();
};

// Faire une enchère
export const placeBid = async (playerId, bid) => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
        throw new Error('Room not found');
    }

    const gameData = roomDoc.data();

    // Trouver l'index du joueur actuel et le joueur suivant
    const currentPlayerIndex = gameData.players.findIndex(p => p.id === playerId);
    const nextPlayerIndex = (currentPlayerIndex + 1) % gameData.players.filter(p => p.diceCount > 0).length;
    const nextPlayer = gameData.players.filter(p => p.diceCount > 0)[nextPlayerIndex];

    // Mettre à jour les données de jeu
    await updateDoc(roomRef, {
        lastBid: {
            playerId,
            diceValue: bid.diceValue,
            diceCount: bid.diceCount,
            timestamp: new Date()
        },
        currentTurn: nextPlayer.id,
        gameLog: arrayUnion({
            type: 'bid',
            playerId,
            bid,
            timestamp: new Date()
        })
    });

    return {
        ...gameData,
        lastBid: {
            playerId,
            diceValue: bid.diceValue,
            diceCount: bid.diceCount
        },
        currentTurn: nextPlayer.id
    };
};

// Contester une enchère (Dudo)
export const challengeBid = async (playerId) => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
        throw new Error('Room not found');
    }

    const gameData = roomDoc.data();

    if (!gameData.lastBid) {
        throw new Error('No bid to challenge');
    }

    // Calculer le nombre total de dés correspondant à l'enchère
    const diceValue = gameData.lastBid.diceValue;
    const targetCount = gameData.lastBid.diceCount;

    // Compte le nombre de dés correspondant à la valeur de l'enchère + les Paco (1)
    let actualCount = 0;
    gameData.players.forEach(player => {
        if (player.dice) {
            player.dice.forEach(die => {
                if (die === diceValue || (die === 1 && diceValue !== 1)) {
                    actualCount++;
                }
            });
        }
    });

    // Déterminer le perdant
    const challengedPlayerId = gameData.lastBid.playerId;
    const losingPlayerId = actualCount >= targetCount ? playerId : challengedPlayerId;

    // Mettre à jour les dés du perdant
    const updatedPlayers = gameData.players.map(player => {
        if (player.id === losingPlayerId) {
            const newDiceCount = player.diceCount - 1;
            return {
                ...player,
                diceCount: newDiceCount,
                dice: newDiceCount > 0 ? player.dice.slice(0, newDiceCount) : []
            };
        }
        return player;
    });

    // Vérifier s'il ne reste qu'un joueur avec des dés
    const playersWithDice = updatedPlayers.filter(p => p.diceCount > 0);
    const isGameOver = playersWithDice.length <= 1;

    // Préparer la prochaine manche si le jeu n'est pas terminé
    let nextRound = gameData.round;
    let nextTurn = playerId;

    if (!isGameOver) {
        nextRound++;
        nextTurn = losingPlayerId;

        // Si le joueur n'a plus de dés, passer au joueur suivant
        if (updatedPlayers.find(p => p.id === losingPlayerId).diceCount === 0) {
            const loserIndex = updatedPlayers.findIndex(p => p.id === losingPlayerId);
            nextTurn = updatedPlayers[(loserIndex + 1) % updatedPlayers.length].id;
        }

        // Générer de nouveaux dés pour tous les joueurs
        updatedPlayers.forEach(player => {
            if (player.diceCount > 0) {
                player.dice = Array(player.diceCount).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
            }
        });
    }

    await updateDoc(roomRef, {
        players: updatedPlayers,
        status: isGameOver ? 'finished' : 'playing',
        currentTurn: nextTurn,
        round: nextRound,
        lastBid: null,
        gameLog: arrayUnion({
            type: 'challenge',
            challengerId: playerId,
            challengedId: challengedPlayerId,
            bid: gameData.lastBid,
            actualCount,
            losingPlayerId,
            timestamp: new Date()
        })
    });

    return {
        ...gameData,
        players: updatedPlayers,
        status: isGameOver ? 'finished' : 'playing',
        currentTurn: nextTurn,
        round: nextRound,
        lastBid: null,
        challengeResult: {
            challengerId: playerId,
            challengedId: challengedPlayerId,
            actualCount,
            losingPlayerId,
            isGameOver
        }
    };
};

// Annoncer "Calza" (défi que l'enchère est exacte)
export const declareCalza = async (playerId) => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
        throw new Error('Room not found');
    }

    const gameData = roomDoc.data();

    if (!gameData.lastBid) {
        throw new Error('No bid to declare Calza on');
    }

    // Calculer le nombre total de dés correspondant à l'enchère
    const diceValue = gameData.lastBid.diceValue;
    const targetCount = gameData.lastBid.diceCount;

    // Compte le nombre de dés correspondant à la valeur de l'enchère + les Paco (1)
    let actualCount = 0;
    gameData.players.forEach(player => {
        if (player.dice) {
            player.dice.forEach(die => {
                if (die === diceValue || (die === 1 && diceValue !== 1)) {
                    actualCount++;
                }
            });
        }
    });

    // Déterminer si le Calza est correct
    const isCalzaCorrect = actualCount === targetCount;

    // Mettre à jour les dés du joueur qui a déclaré Calza
    const updatedPlayers = gameData.players.map(player => {
        if (player.id === playerId) {
            if (isCalzaCorrect) {
                // Le joueur récupère un dé s'il a raison
                const newDiceCount = Math.min(player.diceCount + 1, 5);
                return {
                    ...player,
                    diceCount: newDiceCount,
                    dice: Array(newDiceCount).fill(0).map(() => Math.floor(Math.random() * 6) + 1)
                };
            } else {
                // Le joueur perd un dé s'il a tort
                const newDiceCount = player.diceCount - 1;
                return {
                    ...player,
                    diceCount: newDiceCount,
                    dice: newDiceCount > 0 ? player.dice.slice(0, newDiceCount) : []
                };
            }
        }
        return player;
    });

    // Vérifier s'il ne reste qu'un joueur avec des dés
    const playersWithDice = updatedPlayers.filter(p => p.diceCount > 0);
    const isGameOver = playersWithDice.length <= 1;

    // Préparer la prochaine manche si le jeu n'est pas terminé
    let nextRound = gameData.round;
    let nextTurn = playerId;

    if (!isGameOver) {
        nextRound++;

        // Si le joueur n'a plus de dés, passer au joueur suivant
        if (updatedPlayers.find(p => p.id === playerId).diceCount === 0) {
            const calzaPlayerIndex = updatedPlayers.findIndex(p => p.id === playerId);
            nextTurn = updatedPlayers[(calzaPlayerIndex + 1) % updatedPlayers.length].id;
        }

        // Générer de nouveaux dés pour tous les joueurs
        updatedPlayers.forEach(player => {
            if (player.diceCount > 0) {
                player.dice = Array(player.diceCount).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
            }
        });
    }

    await updateDoc(roomRef, {
        players: updatedPlayers,
        status: isGameOver ? 'finished' : 'playing',
        currentTurn: nextTurn,
        round: nextRound,
        lastBid: null,
        gameLog: arrayUnion({
            type: 'calza',
            playerId,
            bid: gameData.lastBid,
            actualCount,
            isCalzaCorrect,
            timestamp: new Date()
        })
    });

    return {
        ...gameData,
        players: updatedPlayers,
        status: isGameOver ? 'finished' : 'playing',
        currentTurn: nextTurn,
        round: nextRound,
        lastBid: null,
        calzaResult: {
            playerId,
            actualCount,
            targetCount,
            isCalzaCorrect,
            isGameOver
        }
    };
};

// Écouteur en temps réel pour les changements d'état du jeu
export const subscribeToGame = (callback) => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    return onSnapshot(roomRef, (doc) => {
        if (doc.exists()) {
            console.log(`Game data updated: ${JSON.stringify(doc.data())}`);
            callback(doc.data());
        } else {
            console.log('No such document!');
            callback(null);
        }
    });
};

// Réinitialiser le jeu
export const resetGame = async () => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
        throw new Error('Room not found');
    }

    const gameData = roomDoc.data();

    await updateDoc(roomRef, {
        status: 'waiting',
        players: gameData.players.map(p => ({
            ...p,
            dice: [],
            diceCount: 0
        })),
        currentTurn: null,
        lastBid: null,
        round: 0,
        gameLog: []
    });

    return {
        ...gameData,
        status: 'waiting',
        players: gameData.players.map(p => ({
            ...p,
            dice: [],
            diceCount: 0
        })),
        currentTurn: null,
        lastBid: null,
        round: 0
    };
};


// Dans gameService.js
export const testFirestoreConnection = async () => {
    try {
      const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
      const docSnap = await getDoc(roomRef);
      
      if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
        return docSnap.data();
      } else {
        console.log("No such document!");
        return null;
      }
    } catch (error) {
      console.error("Error testing Firestore connection:", error);
      return null;
    }
  };