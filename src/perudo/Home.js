import React from 'react';
import * as gameService from './backend/gameService'; // Si vous utilisez des exportations nommées



const Home = () => {
  const player = {
    name: "Alice",
    id: "12345",             // ID unique du joueur
    dice: [4, 2, 6, 1, 5],   // dés tirés aléatoirement entre 1 et 6
    diceCount: 5,            // nombre de dés restants
    isActive: true           // est-ce que ce joueur est actif actuellement
  };

  const newplayer = {
    name: "victor",
    id: "23414",             // ID unique du joueur
    dice: [4, 2, 6, 1, 5],   // dés tirés aléatoirement entre 1 et 6
    diceCount: 5,            // nombre de dés restants
    isActive: true           // est-ce que ce joueur est actif actuellement
  };

  const handleCreateRoom = async () => {
    try {
      const room = await gameService.createRoom(player);
      console.log('Room created:', room);
      // You can add navigation or state updates here
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleJoinRoom = async () => {
    try {
      const room = await gameService.joinRoom(newplayer);
      console.log('Room joined:', room);
      // You can add navigation or state updates here
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  return (
    <div className="text-white">
      <h1>Welcome to Perudo</h1>
      <button onClick={handleCreateRoom}>Create Room</button>
      <button onClick={handleJoinRoom}>Join Room</button>

    </div>
  );
};

export default Home;