import React, { useState, useEffect, useRef } from 'react';

const Game = () => {
  const TIME_LIMIT = 20000; // 30 sec
  const MAX_TIME = 30000;
  const IMAGE_POOL = ['almosnino.jpg', 'sarcher.jpg', 'forax.jpg', 'lanau.jpg'];

  const getRandomVelocity = () => ({
    velocityX: Math.random() > 0.5 ? 1 : -1,
    velocityY: Math.random() > 0.5 ? 1 : -1,
  });

  const createHead = (id, image, zIndex = 1) => ({
    id,
    image,
    left: Math.random() * (window.innerWidth - 50),
    top: Math.random() * (window.innerHeight - 50),
    ...getRandomVelocity(),
    zIndex,
  });

  const [heads, setHeads] = useState([
    createHead(1, 'samule.jpg', Math.floor(Math.random() * 6)),
    createHead(2, getRandomImage()),
    createHead(3, getRandomImage()),
  ]);
  const [nextId, setNextId] = useState(4);
  const [rounds, setRounds] = useState(1);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

  const timerRef = useRef(null);
  const headsRef = useRef(heads);

  function getRandomImage() {
    return IMAGE_POOL[Math.floor(Math.random() * IMAGE_POOL.length)];
  }

  useEffect(() => {
    headsRef.current = heads;
  }, [heads]);

  const updatePositions = () => {
    const newHeads = headsRef.current.map(head => {
      let newLeft = head.left + head.velocityX;
      let newTop = head.top + head.velocityY;
      let { velocityX, velocityY } = head;

      if (newLeft <= 0 || newLeft >= window.innerWidth - 50) {
        velocityX = -velocityX;
      }
      if (newTop <= 0 || newTop >= window.innerHeight - 50) {
        velocityY = -velocityY;
      }

      return { ...head, left: newLeft, top: newTop, velocityX, velocityY };
    });

    setHeads(newHeads);
  };

  useEffect(() => {
    let animationFrameId;

    const moveHeads = () => {
      updatePositions();
      animationFrameId = requestAnimationFrame(moveHeads);
    };

    animationFrameId = requestAnimationFrame(moveHeads);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    restartTimer();
    return () => clearInterval(timerRef.current);
  }, []);

  const restartTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(prev => Math.min(prev + 5000, MAX_TIME));

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

  const resetHeads = () => {
    const currentHeads = headsRef.current;

    const resetCurrent = currentHeads.map(head => {
      const isSamule = head.id === 1;
      return {
        ...head,
        left: Math.random() * (window.innerWidth - 50),
        top: Math.random() * (window.innerHeight - 50),
        ...getRandomVelocity(),
        zIndex: isSamule ? Math.floor(Math.random() * 6) : 1,
      };
    });

    const newImages = [
      createHead(nextId, getRandomImage()),
      createHead(nextId + 1, getRandomImage()),
    ];

    setNextId(prev => prev + 2);
    setHeads([...resetCurrent, ...newImages]);
    setRounds(prev => prev + 1);
    restartTimer();
  };

  const checkClick = (e) => {
    if (gameOver) return;

    const { clientX, clientY } = e;
    const size = 50;

    for (const head of headsRef.current) {
      if (
        clientX >= head.left && clientX <= head.left + size &&
        clientY >= head.top && clientY <= head.top + size
      ) {
        if (head.id === 1) {
          resetHeads();
        } else {
          loseLife();
        }
        break;
      }
    }
  };

  const goToHome = () => {
    window.location.href = '/'; // à adapter selon ton routing
  };

  const replay = () => {
    setHeads([
      createHead(1, 'samule.jpg', Math.floor(Math.random() * 6)),
      createHead(2, getRandomImage()),
      createHead(3, getRandomImage()),
    ]);
    setNextId(4);
    setRounds(1);
    setLives(3);
    setGameOver(false);
    setTimeLeft(TIME_LIMIT);
    restartTimer();
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
      {heads.map(head => (
        <img
          key={head.id}
          src={head.image}
          alt={`head-${head.id}`}
          style={{
            position: 'absolute',
            left: head.left,
            top: head.top,
            borderRadius: '50%',
            width: 50,
            height: 50,
            transition: 'none',
            zIndex: head.zIndex,
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          color: 'white',
          fontSize: 20,
        }}
      >
        Round : {rounds} <br />
        Vies : {lives} <br />
        Temps restant : {Math.ceil(timeLeft / 1000)}s
      </div>

      {gameOver && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'red',
            fontSize: 40,
            fontWeight: 'bold',
            textAlign: 'center',
          }}
        >
          GAME OVER
          <br />
          <button
            onClick={replay}
            style={{
              marginTop: 20,
              fontSize: 20,
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            Rejouer
          </button>
          <br />
          <button
            onClick={goToHome}
            style={{
              marginTop: 10,
              fontSize: 18,
              padding: '8px 16px',
              cursor: 'pointer',
              backgroundColor: 'white',
              border: 'none',
            }}
          >
            Retour à l’accueil
          </button>
        </div>
      )}
    </div>
  );
};

export default Game;