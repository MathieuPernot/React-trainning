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