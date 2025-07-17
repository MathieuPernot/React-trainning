Le backend du jeu est assuré par une base de donnée firebase.
Il ne peut y avoir qu'une seule partie simultanément. Ce qui est bien.
Voici la structure sur firebase : 


/games
   /game_default  // Une seule room pour commencer
      - status: "waiting" | "playing" | "finished"
      - createdBy: "playerID"
      - currentPlayer: "playerID"
      - lastAction: { type, player, value, count }
      - players: [
          {
            id: "playerID",
            name: "PlayerName",
            diceCount: 5,
            dice: [1, 2, 3, 4, 5],
            isReady: true
          }
        ]
      - round: 1
      - lastUpdate: timestamp



Celui qui a créer la partie doit pouvoir l'annuler. Et la partie doit s'arreter automatiquement si le chef ne s'est pas connecté pendant 1 minutes.

Peux tu implémenter plus de logique backend pour assurer une meilleure stabilitée ?