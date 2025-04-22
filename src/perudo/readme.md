perudo-app/
├── public/
│   ├── index.html
│   └── assets/
│       └── images/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── DiceContainer.jsx
│   │   │   └── PlayerCard.jsx
│   │   ├── game/
│   │   │   ├── Dice.jsx
│   │   │   ├── GameBoard.jsx
│   │   │   ├── GameControls.jsx
│   │   │   ├── GameStatus.jsx
│   │   │   └── PlayerHand.jsx
│   │   └── screens/
│   │       ├── Home.jsx
│   │       ├── GameRoom.jsx
│   │       └── WaitingRoom.jsx
│   ├── context/
│   │   └── GameContext.jsx
│   ├── firebase/
│   │   ├── config.js
│   │   └── gameService.js
│   ├── hooks/
│   │   ├── useGame.js
│   │   └── usePlayer.js
│   ├── utils/
│   │   ├── diceUtils.js
│   │   ├── gameLogic.js
│   │   └── storageUtils.js
│   ├── App.jsx
│   ├── index.jsx
│   └── styles.css
├── package.json
└── README.md



games/
  └── [gameId]/
       ├── status: "waiting" | "playing" | "finished"
       ├── currentTurn: playerId
       ├── lastBet: { quantity: number, value: number, playerId: string }
       ├── lastAction: { type: "bet" | "dudo" | "calza", playerId: string, result: boolean }
       ├── round: number
       ├── palifico: boolean
       ├── createdAt: timestamp
       ├── updatedAt: timestamp
       └── players/
            └── [playerId]/
                 ├── name: string
                 ├── dice: [1-6, 1-6, ...] 
                 ├── diceCount: number (nombre de dés restants)
                 ├── isActive: boolean
