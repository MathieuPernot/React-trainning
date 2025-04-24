import React from 'react';
import * as gameService from './backend/gameService';
import DiceContainer from './components/DiceContainer';
import Button from './components/Button';
import Player from './components/Player';
import { useState, useEffect } from 'react';

const Home = () => {
  const [gameState, setGameState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [unsubscribe, setUnsubscribe] = useState(null);

  const player = {
    name: "Alice",
    id: "12345",
    dice: [4, 2, 6, 1, 5],
    diceCount: 5,
    isActive: true
  };

  useEffect(() => {
    const testConnection = async () => {
      const data = await gameService.testFirestoreConnection();
      console.log("Test connection result:", data);
    };
    
    testConnection();
    
    // Reste du code...
  }, []);

  // S'abonner aux mises à jour du jeu
  useEffect(() => {
    // Dans votre fonction handleGameUpdate
    const handleGameUpdate = (gameData) => {
      console.log("Données de jeu reçues:", gameData);

      if (gameData) {
        setGameState(gameData);

        // Vérifiez si la propriété players existe et regardez sa structure
        console.log("Structure de players:", gameData.players);

        if (gameData.players) {
          // Vérifiez combien de joueurs sont dans l'objet
          console.log("Nombre de joueurs dans l'objet:", Object.keys(gameData.players).length);

          const playersArray = Object.entries(gameData.players).map(([id, data]) => {
            console.log(`Traitement du joueur ${id}:`, data);
            return {
              id,
              ...data,
              isCurrentTurn: id === gameData.currentTurn
            };
          });

          console.log("Tableau de joueurs créé:", playersArray);
          setPlayers(playersArray);

          // Le reste du code...
        } else {
          console.log("La propriété 'players' est manquante ou null dans les données de jeu");
        }
      } else {
        console.log("Aucune donnée de jeu reçue");
      }
    };

    // S'abonner au changement d'état du jeu
    const unsub = gameService.subscribeToGame(handleGameUpdate);
    setUnsubscribe(unsub);

    // Nettoyer l'abonnement quand le composant est démonté
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Effet supplémentaire pour logger les joueurs après chaque mise à jour
  useEffect(() => {
    console.log("players state updated:", players);
  }, [players]);

  const handleCalza = async () => {
    try {
      // const room = await gameService.calza();
      console.log("launch Calza");
    } catch (error) {
      console.error('Error calza :', error);
    }
  };

  const handleDudo = async () => {
    try {
      // const room = await gameService.dudo();
      console.log("launch Dudo");
    } catch (error) {
      console.error('Error dudo :', error);
    }
  };

  const handleRaise = async () => {
    try {
      // const room = await gameService.raise();
      console.log("launch Raise");
    } catch (error) {
      console.error('Error raise :', error);
    }
  };

  return (
    <div className="text-white">
      <h1>Welcome to Perudo</h1>

      <Button onClick={handleCalza}>Calza</Button>
      <Button onClick={handleDudo}>Dudo</Button>
      <Button onClick={handleRaise}>Raise</Button>

      <DiceContainer diceList={[1, 2, 4, 4, 3]} />
      <Player name="Alice" diceCount={5} bet={[2, 3]} isCurrentTurn={true} />

      {/* Afficher le nombre de joueurs pour déboguer */}
      <p>Nombre de joueurs récupérés: {players.length}</p>

      {/* N'affichez les joueurs que si l'array n'est pas vide */}
      {players.length > 0 ? (
        players.map((p) => (
          <Player
            key={p.id} // Ajout d'une clé unique
            name={p.name}
            diceCount={p.diceCount}
            bet={gameState?.lastBet && gameState.lastBet.playerId === p.id ?
              [gameState.lastBet.quantity, gameState.lastBet.value] : null}
            isCurrentTurn={p.id === gameState?.currentTurn}
          />
        ))
      ) : (
        <p>Aucun joueur n'est actuellement connecté.</p>
      )}
    </div>
  );
};

export default Home;