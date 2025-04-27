// src/firebase/gameService.js
import { collection, doc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
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

    // Si la room n'existe pas, on la crée avec ce joueur comme hôte
    if (!roomDoc.exists()) {
        return createRoom(player);
    }

    const roomData = roomDoc.data();
    
    // Chercher si un joueur avec le même nom existe déjà
    const existingPlayer = roomData.players.find(p => p.name.toLowerCase() === player.name.toLowerCase());
    
    if (existingPlayer) {
        // Mettre à jour l'ID du joueur existant et le reconnecter
        const updatedPlayers = roomData.players.map(p => 
            p.name.toLowerCase() === player.name.toLowerCase()
                ? { ...p, id: player.id, isConnected: true }
                : p
        );

        await updateDoc(roomRef, {
            players: updatedPlayers
        });

        return {
            ...roomData,
            players: updatedPlayers
        };
    } else {
        // Vérifier si la partie n'est pas déjà en cours
        if (roomData.status === 'playing') {
            throw new Error('La partie est déjà en cours, impossible de rejoindre maintenant');
        }

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
    const updatedPlayers = roomData.players.map(p => 
        p.id === playerId ? { ...p, isConnected: false } : p
    );

    // Si tous les joueurs sont déconnectés, supprimer la room
    const anyConnectedPlayers = updatedPlayers.some(p => p.isConnected);
    if (!anyConnectedPlayers) {
        await deleteDoc(roomRef);
        return;
    }

    await updateDoc(roomRef, {
        players: updatedPlayers
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

// Fonction utilitaire pour valider une enchère
const isValidBid = (currentBid, lastBid) => {
    // S'il n'y a pas d'enchère précédente, toute enchère est valide
    if (!lastBid) return true;

    // Les Paco (1) sont les plus forts
    const currentValue = currentBid.diceValue;
    const lastValue = lastBid.diceValue;
    const currentCount = currentBid.diceCount;
    const lastCount = lastBid.diceCount;

    // Cas spécial : passage aux Paco
    if (lastValue !== 1 && currentValue === 1) {
        // Pour passer aux Paco, il faut au moins la moitié (arrondi supérieur) du nombre précédent
        return currentCount >= Math.ceil(lastCount / 2);
    }

    // Cas spécial : enchère après les Paco
    if (lastValue === 1 && currentValue !== 1) {
        // Pour sortir des Paco, il faut au moins le double + 1
        return currentCount >= (lastCount * 2) + 1;
    }

    // Même valeur de dé
    if (currentValue === lastValue) {
        return currentCount > lastCount;
    }

    // Valeur de dé différente
    if (currentValue > lastValue) {
        // On peut garder le même nombre de dés si la valeur est supérieure
        return currentCount >= lastCount;
    }

    // Si la valeur est inférieure, il faut augmenter le nombre de dés
    if (currentValue < lastValue) {
        return currentCount > lastCount;
    }

    return false;
};

// Faire une enchère
export const placeBid = async (playerId, bid) => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
        throw new Error('Room not found');
    }

    const gameData = roomDoc.data();

    // Vérifier si la partie est terminée
    if (gameData.status === 'finished') {
        throw new Error('La partie est terminée');
    }

    // Vérifier s'il reste assez de joueurs
    const activePlayers = gameData.players.filter(p => p.diceCount > 0);
    if (activePlayers.length <= 1) {
        await updateDoc(roomRef, { status: 'finished' });
        throw new Error('La partie est terminée, il ne reste qu\'un joueur');
    }

    // Vérifier si c'est bien le tour du joueur
    if (gameData.currentTurn !== playerId) {
        throw new Error('Ce n\'est pas votre tour');
    }

    // Valider l'enchère
    if (gameData.lastBid && !isValidBid(bid, gameData.lastBid)) {
        throw new Error('Enchère invalide : elle doit être supérieure à l\'enchère précédente');
    }

    // Trouver l'index du joueur actuel et le joueur suivant
    const currentPlayerIndex = activePlayers.findIndex(p => p.id === playerId);
    if (currentPlayerIndex === -1) {
        throw new Error('Joueur non trouvé ou n\'a plus de dés');
    }

    const nextPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
    const nextPlayer = activePlayers[nextPlayerIndex];

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
    
    try {
        // Supprimer complètement le document
        await deleteDoc(roomRef);
        console.log('Game room deleted successfully');
        return null;
    } catch (error) {
        console.error('Error deleting game room:', error);
        throw error;
    }
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