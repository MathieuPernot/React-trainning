// src/firebase/gameService.js
import { doc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion, deleteDoc } from 'firebase/firestore';
import db from './config';

const GAME_COLLECTION = 'games';
const ROOM_ID = 'game_default';
const HOST_TIMEOUT = 60000; // 1 minute en millisecondes

// Vérifier si le créateur de la partie est toujours actif
const checkHostTimeout = async (gameData, roomRef) => {
    const now = new Date();
    const hostLastSeen = gameData.hostLastSeen?.toDate?.() || gameData.hostLastSeen;
    
    if (hostLastSeen && (now - new Date(hostLastSeen)) > HOST_TIMEOUT) {
        // Le créateur n'est pas actif depuis plus d'1 minute
        console.log('Host timeout detected, deleting room');
        try {
            await deleteDoc(roomRef);
        } catch (error) {
            console.error('Error deleting room on host timeout:', error);
        }
        throw new Error('La partie a été annulée car le créateur n\'est plus actif');
    }
};

// Fonction pour annuler une partie (réservée au créateur)
export const cancelGame = async (playerId) => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
        throw new Error('Aucune partie trouvée');
    }

    const gameData = roomDoc.data();
    
    // Vérifier que c'est bien le créateur qui annule
    if (gameData.createdBy !== playerId) {
        throw new Error('Seul le créateur peut annuler la partie');
    }

    // Supprimer la partie
    await deleteDoc(roomRef);
    return { success: true, message: 'Partie annulée avec succès' };
};

// Fonction pour marquer un joueur comme étant prêt
export const setPlayerReady = async (playerId, isReady = true) => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
        throw new Error('Partie non trouvée');
    }

    const gameData = roomDoc.data();
    const now = new Date();
    
    const updatedPlayers = gameData.players.map(p => 
        p.id === playerId 
            ? { ...p, isReady, lastSeen: now }
            : p
    );

    // Mettre à jour hostLastSeen si c'est le créateur
    const updateData = {
        players: updatedPlayers,
        lastUpdate: now
    };

    if (gameData.createdBy === playerId) {
        updateData.hostLastSeen = now;
    }

    await updateDoc(roomRef, updateData);
    return { success: true };
};

// Fonction pour envoyer un heartbeat (maintenir la connexion)
export const sendHeartbeat = async (playerId) => {
    try {
        const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
        const roomDoc = await getDoc(roomRef);

        if (!roomDoc.exists()) {
            return { success: false, message: 'Partie non trouvée' };
        }

        const gameData = roomDoc.data();
        const now = new Date();
        
        // Vérifier si le joueur existe encore dans la partie
        const playerExists = gameData.players.some(p => p.id === playerId);
        if (!playerExists) {
            return { success: false, message: 'Joueur non trouvé dans la partie' };
        }
        
        const updatedPlayers = gameData.players.map(p => 
            p.id === playerId 
                ? { ...p, lastSeen: now, isConnected: true }
                : p
        );

        // Mettre à jour hostLastSeen si c'est le créateur
        const updateData = {
            players: updatedPlayers,
            lastUpdate: now
        };

        if (gameData.createdBy === playerId) {
            updateData.hostLastSeen = now;
        }

        await updateDoc(roomRef, updateData);
        return { success: true };
    } catch (error) {
        console.error('Error sending heartbeat:', error);
        return { success: false, error: error.message };
    }
};

// Vérifie si une room existe
export const checkRoomExists = async () => {
    console.log('🔍 [checkRoomExists] Checking if room exists...');
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);
    const exists = roomDoc.exists();
    console.log('🔍 [checkRoomExists] Room exists:', exists);
    return exists;
};

// Crée une nouvelle room selon la nouvelle structure
export const createRoom = async (hostPlayer) => {
    console.log('🏗️ [createRoom] Creating new room for host:', hostPlayer.name);
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const now = new Date();
    
    const gameData = {
        status: 'waiting', // waiting, playing, finished
        createdBy: hostPlayer.id,
        currentPlayer: null,
        lastAction: null,
        players: [{
            id: hostPlayer.id,
            name: hostPlayer.name,
            diceCount: 5,
            dice: [],
            isReady: false,
            lastSeen: now,
            isCreator: true
        }],
        round: 1,
        lastUpdate: now,
        createdAt: now,
        hostLastSeen: now
    };

    await setDoc(roomRef, gameData);
    console.log('✅ [createRoom] Room created successfully');
    return gameData;
};

// Rejoindre une room existante
export const joinRoom = async (player) => {
    console.log('🚪 [joinRoom] Player trying to join:', player.name, 'isCreator:', player.isCreator);
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);

    // Si la room n'existe pas, on la crée avec ce joueur comme hôte
    if (!roomDoc.exists()) {
        console.log('🏗️ [joinRoom] No room exists, creating new one');
        return createRoom(player);
    }

    const roomData = roomDoc.data();
    const now = new Date();
    
    console.log('🔍 [joinRoom] Room exists with status:', roomData.status);
    console.log('🔍 [joinRoom] Current players:', roomData.players.map(p => p.name));
    
    // Vérifier si le créateur est toujours actif
    // Vérifier si le créateur de la partie est toujours actif
    try {
        await checkHostTimeout(roomData, roomRef);
    } catch (error) {
        // Si le host a timeout, propager l'erreur
        throw error;
    }
    
    // Chercher si un joueur avec le même nom existe déjà
    const existingPlayer = roomData.players.find(p => p.name.toLowerCase() === player.name.toLowerCase());
    
    if (existingPlayer) {
        console.log('🔄 [joinRoom] Player already exists, reconnecting:', player.name);
        // Mettre à jour l'ID du joueur existant et le reconnecter
        const updatedPlayers = roomData.players.map(p => 
            p.name.toLowerCase() === player.name.toLowerCase()
                ? { ...p, id: player.id, lastSeen: now, isConnected: true }
                : p
        );

        await updateDoc(roomRef, {
            players: updatedPlayers,
            lastUpdate: now
        });

        console.log('✅ [joinRoom] Player reconnected successfully');
        return {
            ...roomData,
            players: updatedPlayers
        };
    } else {
        // Vérifier si la partie n'est pas déjà en cours
        if (roomData.status === 'playing') {
            console.log('❌ [joinRoom] Game already in progress');
            throw new Error('La partie est déjà en cours, impossible de rejoindre maintenant');
        }

        console.log('➕ [joinRoom] Adding new player to room');
        // Ajouter le nouveau joueur à la room
        const newPlayer = {
            id: player.id,
            name: player.name,
            diceCount: 5,
            dice: [],
            isReady: false,
            lastSeen: now,
            isCreator: player.isCreator || false
        };

        await updateDoc(roomRef, {
            players: arrayUnion(newPlayer),
            lastUpdate: now
        });
        
        console.log('✅ [joinRoom] New player added successfully');
    }

    return roomDoc.data();
};

// Déconnexion d'un joueur
export const disconnectPlayer = async (playerId) => {
    try {
        const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
        const roomDoc = await getDoc(roomRef);

        if (!roomDoc.exists()) {
            return { success: true, message: 'No room exists' };
        }

        const roomData = roomDoc.data();
        const now = new Date();
        
        // Marquer le joueur comme déconnecté
        const updatedPlayers = roomData.players.map(p => 
            p.id === playerId 
                ? { ...p, isConnected: false, lastSeen: now }
                : p
        );

        // Si le créateur se déconnecte, supprimer la partie
        if (roomData.createdBy === playerId) {
            console.log('Creator disconnecting, deleting game room');
            await deleteDoc(roomRef);
            return { success: true, message: 'Game deleted due to creator disconnect' };
        }

        // Si tous les joueurs sont déconnectés, supprimer la room
        const anyConnectedPlayers = updatedPlayers.some(p => p.isConnected !== false);
        if (!anyConnectedPlayers) {
            console.log('All players disconnected, deleting game room');
            await deleteDoc(roomRef);
            return { success: true, message: 'Game deleted - all players disconnected' };
        }

        await updateDoc(roomRef, {
            players: updatedPlayers,
            lastUpdate: now
        });
        
        return { success: true, message: 'Player disconnected successfully' };
    } catch (error) {
        console.error('Error disconnecting player:', error);
        return { success: false, error: error.message };
    }
};

// Fonction pour nettoyer les joueurs inactifs
export const cleanupInactivePlayers = async () => {
    try {
        const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
        const roomDoc = await getDoc(roomRef);

        if (!roomDoc.exists()) {
            return { success: true, message: 'No room to cleanup' };
        }

        const roomData = roomDoc.data();
        const now = new Date();
        const INACTIVE_TIMEOUT = 300000; // 5 minutes
        
        // Filtrer les joueurs inactifs
        const activePlayers = roomData.players.filter(player => {
            const lastSeen = player.lastSeen?.toDate?.() || new Date(player.lastSeen);
            return lastSeen && (now - lastSeen) < INACTIVE_TIMEOUT;
        });

        // Si le créateur n'est plus actif, supprimer la partie
        const creatorActive = activePlayers.some(p => p.id === roomData.createdBy);
        if (!creatorActive) {
            console.log('Creator inactive, deleting game room');
            await deleteDoc(roomRef);
            return { success: true, message: 'Game deleted due to inactive creator' };
        }

        // Mettre à jour avec les joueurs actifs seulement
        if (activePlayers.length !== roomData.players.length) {
            const removedPlayers = roomData.players.length - activePlayers.length;
            console.log(`Removing ${removedPlayers} inactive players`);
            
            await updateDoc(roomRef, {
                players: activePlayers,
                lastUpdate: now
            });
            return { success: true, message: `Removed ${removedPlayers} inactive players` };
        }
        
        return { success: true, message: 'No cleanup needed' };
    } catch (error) {
        console.error('Error during cleanup:', error);
        return { success: false, error: error.message };
    }
};

// Démarrer la partie
export const startGame = async (creatorId) => {
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
        throw new Error('Partie non trouvée');
    }

    const gameData = roomDoc.data();
    
    // Vérifier que c'est bien le créateur qui démarre
    if (gameData.createdBy !== creatorId) {
        throw new Error('Seul le créateur peut démarrer la partie');
    }

    // Vérifier que tous les joueurs sont prêts
    const playersReady = gameData.players.filter(p => p.isReady).length;
    if (playersReady < gameData.players.length) {
        throw new Error('Tous les joueurs ne sont pas prêts');
    }

    // Distribuer les dés aux joueurs
    const players = gameData.players.map(player => {
        return {
            ...player,
            dice: Array(5).fill(0).map(() => Math.floor(Math.random() * 6) + 1),
            diceCount: 5
        };
    });

    // Déterminer le premier joueur
    const startingPlayerIndex = Math.floor(Math.random() * players.length);
    const now = new Date();

    await updateDoc(roomRef, {
        status: 'playing',
        players,
        currentPlayer: players[startingPlayerIndex].id,
        round: 1,
        lastAction: {
            type: 'game_start',
            player: creatorId,
            timestamp: now
        },
        lastUpdate: now,
        hostLastSeen: now
    });

    return gameData;
};

// Fonction simplifiée pour rejoindre ou créer un lobby
export const joinOrCreateLobby = async (player) => {
    console.log('🚀 [joinOrCreateLobby] Player connecting:', player.name);
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);
    const now = new Date();

    // Si aucune room n'existe, en créer une nouvelle
    if (!roomDoc.exists()) {
        console.log('🏗️ [joinOrCreateLobby] Creating new room');
        const gameData = {
            status: 'waiting',
            createdBy: player.id,
            currentPlayer: null,
            lastAction: null,
            players: [{
                id: player.id,
                name: player.name,
                diceCount: 5,
                dice: [],
                isReady: false,
                lastSeen: now,
                isCreator: true
            }],
            round: 1,
            lastUpdate: now,
            createdAt: now
        };

        await setDoc(roomRef, gameData);
        console.log('✅ [joinOrCreateLobby] New room created');
        return gameData;
    }

    // Room existe, vérifier si le joueur peut rejoindre
    const gameData = roomDoc.data();
    
    // Vérifier si la partie est en cours
    if (gameData.status === 'playing') {
        throw new Error('La partie est déjà en cours');
    }

    // Chercher si le joueur existe déjà (reconnexion)
    const existingPlayerIndex = gameData.players.findIndex(p => 
        p.name.toLowerCase() === player.name.toLowerCase()
    );

    if (existingPlayerIndex !== -1) {
        // Reconnexion du joueur existant
        console.log('🔄 [joinOrCreateLobby] Player reconnecting:', player.name);
        const updatedPlayers = [...gameData.players];
        updatedPlayers[existingPlayerIndex] = {
            ...updatedPlayers[existingPlayerIndex],
            id: player.id,
            lastSeen: now
        };

        await updateDoc(roomRef, {
            players: updatedPlayers,
            lastUpdate: now
        });

        return { ...gameData, players: updatedPlayers };
    } else {
        // Nouveau joueur
        console.log('➕ [joinOrCreateLobby] Adding new player:', player.name);
        const newPlayer = {
            id: player.id,
            name: player.name,
            diceCount: 5,
            dice: [],
            isReady: false,
            lastSeen: now,
            isCreator: false
        };

        await updateDoc(roomRef, {
            players: arrayUnion(newPlayer),
            lastUpdate: now
        });

        console.log('✅ [joinOrCreateLobby] Player added successfully');
        return gameData;
    }
};

// Fonction utilitaire pour valider une enchère
const isValidBid = (currentBid, lastBid, isPalifico = false) => {
    // S'il n'y a pas d'enchère précédente, toute enchère est valide
    if (!lastBid) return true;

    const currentValue = currentBid.diceValue;
    const lastValue = lastBid.diceValue;
    const currentCount = currentBid.diceCount;
    const lastCount = lastBid.diceCount;

    // En mode Palifico, seule la quantité peut augmenter avec la même valeur
    if (isPalifico) {
        return currentValue === lastValue && currentCount > lastCount;
    }

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

// Fonction de validation des entrées
const validatePlayerId = (playerId) => {
    if (!playerId || typeof playerId !== 'string' || playerId.trim() === '') {
        throw new Error('ID de joueur invalide');
    }
};

const validateBid = (bid) => {
    if (!bid || typeof bid !== 'object') {
        throw new Error('Enchère invalide');
    }
    
    const { diceValue, diceCount } = bid;
    
    if (!Number.isInteger(diceValue) || diceValue < 1 || diceValue > 6) {
        throw new Error('Valeur de dé invalide (doit être entre 1 et 6)');
    }
    
    if (!Number.isInteger(diceCount) || diceCount < 1 || diceCount > 50) {
        throw new Error('Nombre de dés invalide (doit être entre 1 et 50)');
    }
};

const validatePlayerName = (name) => {
    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw new Error('Nom de joueur invalide');
    }
    
    if (name.length > 20) {
        throw new Error('Nom de joueur trop long (maximum 20 caractères)');
    }
    
    // Vérifier les caractères autorisés
    if (!/^[a-zA-Z0-9À-ſ\s-_]+$/.test(name)) {
        throw new Error('Nom de joueur contient des caractères non autorisés');
    }
};

// Faire une enchère
export const placeBid = async (playerId, bid) => {
    // Validation des entrées
    validatePlayerId(playerId);
    validateBid(bid);
    
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
        throw new Error('Partie non trouvée');
    }

    const gameData = roomDoc.data();
    const now = new Date();

    // Vérifier si la partie est terminée
    if (gameData.status === 'finished') {
        throw new Error('La partie est terminée');
    }

    // Vérifier s'il reste assez de joueurs
    const activePlayers = gameData.players.filter(p => p.diceCount > 0);
    if (activePlayers.length <= 1) {
        await updateDoc(roomRef, { 
            status: 'finished',
            lastUpdate: now 
        });
        throw new Error('La partie est terminée, il ne reste qu\'un joueur');
    }

    // Vérifier si c'est bien le tour du joueur
    if (gameData.currentPlayer !== playerId) {
        throw new Error('Ce n\'est pas votre tour');
    }

    // Déterminer si on est en mode Palifico
    const currentPlayer = gameData.players.find(p => p.id === playerId);
    const isPalifico = currentPlayer && currentPlayer.diceCount === 1;

    // Valider l'enchère
    if (gameData.lastAction && gameData.lastAction.type === 'bid' && 
        !isValidBid(bid, { 
            diceValue: gameData.lastAction.value, 
            diceCount: gameData.lastAction.count 
        }, isPalifico)) {
        throw new Error('Enchère invalide : elle doit être supérieure à l\'enchère précédente');
    }

    // Trouver l'index du joueur actuel et le joueur suivant
    const currentPlayerIndex = activePlayers.findIndex(p => p.id === playerId);
    if (currentPlayerIndex === -1) {
        throw new Error('Joueur non trouvé ou n\'a plus de dés');
    }

    const nextPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
    const nextPlayer = activePlayers[nextPlayerIndex];

    // Mettre à jour les joueurs avec lastSeen
    const updatedPlayers = gameData.players.map(p => 
        p.id === playerId 
            ? { ...p, lastSeen: now }
            : p
    );

    // Mettre à jour les données de jeu
    const updateData = {
        lastAction: {
            type: 'bid',
            player: playerId,
            value: bid.diceValue,
            count: bid.diceCount,
            isPalifico: isPalifico,
            timestamp: now
        },
        currentPlayer: nextPlayer.id,
        players: updatedPlayers,
        lastUpdate: now
    };

    // Mettre à jour hostLastSeen si c'est le créateur
    if (gameData.createdBy === playerId) {
        updateData.hostLastSeen = now;
    }

    await updateDoc(roomRef, updateData);

    return {
        ...gameData,
        lastAction: updateData.lastAction,
        currentPlayer: nextPlayer.id
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

    if (!gameData.lastAction || gameData.lastAction.type !== 'bid') {
        throw new Error('Aucune enchère à contester');
    }

    // Calculer le nombre total de dés correspondant à l'enchère
    const diceValue = gameData.lastAction.value;
    const targetCount = gameData.lastAction.count;

    // Compte le nombre de dés correspondant à la valeur de l'enchère + les Paco (1)
    let actualCount = 0;
    const isPalifico = gameData.lastAction && gameData.lastAction.isPalifico;
    
    gameData.players.forEach(player => {
        if (player.dice) {
            player.dice.forEach(die => {
                if (isPalifico) {
                    // En mode Palifico, les Paco ne sont pas des jokers
                    if (die === diceValue) {
                        actualCount++;
                    }
                } else {
                    // Mode normal : les Paco sont des jokers
                    if (die === diceValue || (die === 1 && diceValue !== 1)) {
                        actualCount++;
                    }
                }
            });
        }
    });

    // Déterminer le perdant
    const challengedPlayerId = gameData.lastAction.player;
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
    let nextTurn = losingPlayerId;

    if (!isGameOver) {
        nextRound++;
        
        // Si le joueur qui a perdu n'a plus de dés, passer au joueur suivant
        const losingPlayer = updatedPlayers.find(p => p.id === losingPlayerId);
        if (losingPlayer && losingPlayer.diceCount === 0) {
            const loserIndex = updatedPlayers.findIndex(p => p.id === losingPlayerId);
            
            // Trouver le prochain joueur actif
            let nextIndex = (loserIndex + 1) % updatedPlayers.length;
            while (updatedPlayers[nextIndex].diceCount === 0) {
                nextIndex = (nextIndex + 1) % updatedPlayers.length;
            }
            nextTurn = updatedPlayers[nextIndex].id;
        }

        // Générer de nouveaux dés pour tous les joueurs actifs
        updatedPlayers.forEach(player => {
            if (player.diceCount > 0) {
                player.dice = Array(player.diceCount).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
            }
        });
    }

    await updateDoc(roomRef, {
        players: updatedPlayers,
        status: isGameOver ? 'finished' : 'playing',
        currentPlayer: nextTurn,
        round: nextRound,
        lastAction: {
            type: 'challenge',
            player: playerId,
            challengedPlayer: challengedPlayerId,
            actualCount,
            losingPlayerId,
            timestamp: new Date()
        },
        lastUpdate: new Date()
    });

    return {
        ...gameData,
        players: updatedPlayers,
        status: isGameOver ? 'finished' : 'playing',
        currentPlayer: nextTurn,
        round: nextRound,
        lastAction: {
            type: 'challenge',
            player: playerId,
            challengedPlayer: challengedPlayerId,
            actualCount,
            losingPlayerId,
            timestamp: new Date()
        },
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

    if (!gameData.lastAction || gameData.lastAction.type !== 'bid') {
        throw new Error('Aucune enchère pour déclarer Calza');
    }

    // Calculer le nombre total de dés correspondant à l'enchère
    const diceValue = gameData.lastAction.value;
    const targetCount = gameData.lastAction.count;

    // Compte le nombre de dés correspondant à la valeur de l'enchère + les Paco (1)
    let actualCount = 0;
    const isPalifico = gameData.lastAction && gameData.lastAction.isPalifico;
    
    gameData.players.forEach(player => {
        if (player.dice) {
            player.dice.forEach(die => {
                if (isPalifico) {
                    // En mode Palifico, les Paco ne sont pas des jokers
                    if (die === diceValue) {
                        actualCount++;
                    }
                } else {
                    // Mode normal : les Paco sont des jokers
                    if (die === diceValue || (die === 1 && diceValue !== 1)) {
                        actualCount++;
                    }
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
        currentPlayer: nextTurn,
        round: nextRound,
        lastAction: {
            type: 'calza',
            player: playerId,
            actualCount,
            isCalzaCorrect,
            timestamp: new Date()
        },
        lastUpdate: new Date()
    });

    return {
        ...gameData,
        players: updatedPlayers,
        status: isGameOver ? 'finished' : 'playing',
        currentPlayer: nextTurn,
        round: nextRound,
        lastAction: {
            type: 'calza',
            player: playerId,
            actualCount,
            isCalzaCorrect,
            timestamp: new Date()
        },
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
    console.log('👂 [subscribeToGame] Setting up game listener');
    const roomRef = doc(db, GAME_COLLECTION, ROOM_ID);
    
    const unsubscribe = onSnapshot(roomRef, (doc) => {
        try {
            if (doc.exists()) {
                const gameData = doc.data();
                console.log('📡 [subscribeToGame] Game data updated:', {
                    status: gameData.status,
                    players: gameData.players?.map(p => ({ name: p.name, isReady: p.isReady, isCreator: p.isCreator })) || [],
                    createdBy: gameData.createdBy
                });
                callback(gameData);
            } else {
                console.log('📡 [subscribeToGame] No game document found');
                callback(null);
            }
        } catch (error) {
            console.error('❌ [subscribeToGame] Error processing game update:', error);
            callback(null);
        }
    }, (error) => {
        console.error('❌ [subscribeToGame] Error listening to game updates:', error);
        // Ne pas appeler callback(null) ici pour éviter de perdre l'état
        // Le composant peut gérer la reconnexion
    });
    
    return unsubscribe;
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