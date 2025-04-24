import React from 'react';
import * as gameService from '../perudo/backend/gameService'; // Si vous utilisez des exportations nommées
import Dice from '../perudo/components/dice';


const perudo = () => {
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
      <Dice number={1} />
      <Dice number={2} />
      <Dice number={3} />
      <Dice number={4} />
      <Dice number={5} />
      <Dice number={6} />

    </div>
  );
};

export default perudo;