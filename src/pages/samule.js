import React, { useState, useEffect, useRef } from 'react';

const Game = () => {
  const headsRef = useRef([
    {
      id: 1,
      image: 'samule.png',
      left: Math.random() * window.innerWidth,
      top: Math.random() * window.innerHeight,
      velocityX: 1,
      velocityY: 1,
    },
  ]);

  const [heads, setHeads] = useState(headsRef.current);
  const [rounds, setRounds] = useState(1);

  // Fonction pour générer une direction aléatoire pour les têtes
  const getRandomVelocity = () => {
    return {
      velocityX: Math.random() > 0.5 ? 1 : -1, // direction aléatoire sur X
      velocityY: Math.random() > 0.5 ? 1 : -1, // direction aléatoire sur Y
    };
  };

  // Fonction pour réinitialiser les têtes à chaque round avec 2 nouvelles têtes
  const resetHeads = () => {
    // Nouveau Mario (ID 1)
    const newMario = {
      id: 1,
      image: 'samule.png',
      left: Math.random() * window.innerWidth / 1.1,
      top: Math.random() * window.innerHeight / 1.1,
      ...getRandomVelocity(),
    };

    // Ajouter Peach et Luigi (ID 2 et 3)
    const newPeach = {
      id: 2,
      image: 'https://media.licdn.com/dms/image/v2/D5603AQFnpp6_sBviuQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1705573822826?e=2147483647&v=beta&t=UtAHPpShbv2mv5Vw4Pho5mtDPs0QI2v6dF2cJRkPFM8',
      left: Math.random() * window.innerWidth / 1.1,
      top: Math.random() * window.innerHeight/ 1.1,
      ...getRandomVelocity(),
    };

    const newLuigi = {
      id: 3,
      image: 'emma.png',
      left: Math.random() * window.innerWidth / 1.1,
      top: Math.random() * window.innerHeight / 1.1,
      ...getRandomVelocity(),
    };

    // Ajouter les nouvelles têtes dans le tableau
    headsRef.current = [newMario, newPeach, newLuigi, ...headsRef.current.filter(head => head.id !== 1)];
    setHeads([...headsRef.current]); // Forcer un rerender
    setRounds(rounds + 1); // Incrémenter le nombre de rounds
  };

  // Mettre à jour la position des têtes
  const updatePositions = () => {
    headsRef.current.forEach(head => {
      let newLeft = head.left + head.velocityX;
      let newTop = head.top + head.velocityY;

      // Vérifier les collisions avec les bords de l'écran
      if (newLeft <= 0 || newLeft >= window.innerWidth - 50) {
        head.velocityX = -head.velocityX;
      }

      if (newTop <= 0 || newTop >= window.innerHeight - 50) {
        head.velocityY = -head.velocityY;
      }

      // Mettre à jour les positions
      head.left = newLeft;
      head.top = newTop;
    });

    setHeads([...headsRef.current]); // Mettre à jour les positions à chaque frame
  };

  // Animation des têtes avec `requestAnimationFrame`
  useEffect(() => {
    const moveHeads = () => {
      updatePositions();
      requestAnimationFrame(moveHeads);
    };

    requestAnimationFrame(moveHeads);
    return () => cancelAnimationFrame(moveHeads);
  }, []);

  // Vérifier le clic sur Mario (ID 1)
  const checkClick = (e) => {
    const { clientX, clientY } = e;
    const mario = headsRef.current.find(head => head.id === 1);

    if (mario) {
      const marioLeft = mario.left;
      const marioTop = mario.top;
      const marioSize = 50; // Taille des têtes (ajuster si nécessaire)

      if (
        clientX >= marioLeft && clientX <= marioLeft + marioSize &&
        clientY >= marioTop && clientY <= marioTop + marioSize
      ) {
        resetHeads(); // Démarrer un nouveau round
      }
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw', // occupe toute la largeur de l'écran
        height: '100vh', // occupe toute la hauteur de l'écran
        overflow: 'hidden', // empêcher les têtes de sortir de l'écran
        backgroundColor: 'black',
        cursor: 'crosshair',
      }}
      onClick={checkClick} // Vérifier si Mario est cliqué
    >
      {heads.map((head) => (
        <img
          key={head.id}
          src={head.image}
          alt={`head-${head.id}`}
          style={{
            position: 'absolute',
            left: `${head.left}px`,
            top: `${head.top}px`,
            borderRadius: '50%',
            width: '50px',  // Taille des têtes
            height: '50px', // Taille des têtes
            transition: 'none',  // Pas de transition pour éviter les "accoups"
          }}
        />
      ))}
      <div 
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          color: 'white',
          fontSize: '20px',
        }}
      >
        Round : {rounds} {/* Afficher le nombre de rounds */}
      </div>
    </div>
  );
};

export default Game;
