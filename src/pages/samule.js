import React, { useState, useEffect, useRef } from 'react';

const Game = () => {
  const TIME_LIMIT = 60000; // 60 seconds

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
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const timerRef = useRef(null);

  const getRandomVelocity = () => {
    return {
    velocityX: Math.random() > 0.5 ? 1 : -1,
    velocityY: Math.random() > 0.5 ? 1 : -1,
    }
  };

  const resetHeads = () => {
    const newMario = {
      id: 1,
      image: 'samule.png',
      left: Math.random() * window.innerWidth / 1.1,
      top: Math.random() * window.innerHeight / 1.1,
      ...getRandomVelocity(),
    };

    const newPeach = {
      id: 2,
      image: 'https://media.licdn.com/dms/image/v2/D5603AQFnpp6_sBviuQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1705573822826?e=2147483647&v=beta&t=UtAHPpShbv2mv5Vw4Pho5mtDPs0QI2v6dF2cJRkPFM8',
      left: Math.random() * window.innerWidth / 1.1,
      top: Math.random() * window.innerHeight / 1.1,
      ...getRandomVelocity(),
    };

    const newLuigi = {
      id: 3,
      image: 'emma.png',
      left: Math.random() * window.innerWidth / 1.1,
      top: Math.random() * window.innerHeight / 1.1,
      ...getRandomVelocity(),
    };

    headsRef.current = [newMario, newPeach, newLuigi, ...headsRef.current.filter(head => head.id !== 1)];
    setHeads([...headsRef.current]);

    setRounds(rounds + 1);
    setTimeLeft(TIME_LIMIT);
    restartTimer();
  };

  const updatePositions = () => {
    headsRef.current.forEach(head => {
      let newLeft = head.left + head.velocityX;
      let newTop = head.top + head.velocityY;

      if (newLeft <= 0 || newLeft >= window.innerWidth - 50) {
        head.velocityX = -head.velocityX;
      }

      if (newTop <= 0 || newTop >= window.innerHeight - 50) {
        head.velocityY = -head.velocityY;
      }

      head.left = newLeft;
      head.top = newTop;
    });

    setHeads([...headsRef.current]);
  };

  useEffect(() => {
    const moveHeads = () => {
      updatePositions();
      requestAnimationFrame(moveHeads);
    };

    requestAnimationFrame(moveHeads);
    return () => cancelAnimationFrame(moveHeads);
  }, []);

  useEffect(() => {
    restartTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const restartTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(TIME_LIMIT);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1000) {
          clearInterval(timerRef.current);
          setGameOver(true);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);
  };

  const loseLife = () => {
    setLives(prev => {
      const remaining = prev - 1;
      if (remaining <= 0) {
        setGameOver(true);
        clearInterval(timerRef.current);
      }
      return remaining;
    });
  };

  const checkClick = (e) => {
    if (gameOver) return;

    const { clientX, clientY } = e;

    for (const head of headsRef.current) {
      const { left, top } = head;
      const size = 50;

      if (
        clientX >= left && clientX <= left + size &&
        clientY >= top && clientY <= top + size
      ) {
        if (head.id === 1) {
          resetHeads(); // good click
        } else {
          loseLife(); // wrong click
        }
        break;
      }
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: 'black',
        cursor: 'crosshair',
        userSelect: 'none',
      }}
      onClick={checkClick}
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
            width: '50px',
            height: '50px',
            transition: 'none',
          }}
        />
      ))}

      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: 'white',
        fontSize: '20px',
      }}>
        Round : {rounds} <br />
        Vies : {lives} <br />
        Temps restant : {Math.ceil(timeLeft / 1000)}s
      </div>

      {gameOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'red',
          fontSize: '40px',
          fontWeight: 'bold',
        }}>
          GAME OVER
        </div>
      )}
    </div>
  );
};

export default Game;
