import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import DVDBouncer from '../comp/DVDBouncer';

const App = () => {
  const ballRef = useRef(null);
  const paddleRef = useRef(null);

  const [ballPos, setBallPos] = useState({ x: 50, y: 50, dx: 2, dy: 2 });
  const [paddlePos, setPaddlePos] = useState(50);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  const [gameWidth, setGameWidth] = useState(0);
  const [gameHeight, setGameHeight] = useState(0);
  const [ballSize, setBallSize] = useState(0);
  const [paddleWidth, setPaddleWidth] = useState(0);
  const [paddleHeight] = useState(10);

  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Modification ici : on garde un tableau de bouncers plutôt qu'un seul booléen
  const [dvdBouncers, setDvdBouncers] = useState([]);
  
  // Modification : mise à jour pour ajouter un nouveau bouncer tous les 2 points
  useEffect(() => {
    // Calculer combien de bouncers devraient être affichés
    const bouncersCount = Math.floor(score / 2);
    
    // Si nous avons besoin d'ajouter de nouveaux bouncers
    if (bouncersCount > dvdBouncers.length) {
      // Créer un tableau de nouveaux bouncers
      const newBouncers = [...dvdBouncers];
      
      // Ajouter les bouncers manquants
      for (let i = dvdBouncers.length; i < bouncersCount; i++) {
        newBouncers.push({ id: i });  // Ajouter un ID unique pour chaque bouncer
      }
      
      setDvdBouncers(newBouncers);
    }
  }, [score, dvdBouncers]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLeaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
      setLeaderboard(savedLeaderboard);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth * 0.8;
      const newHeight = window.innerHeight * 0.5;
      setGameWidth(newWidth);
      setGameHeight(newHeight);

      setBallSize(newWidth * 0.05);
      setPaddleWidth(newWidth * 0.15);

      setPaddlePos((prevPaddlePos) => {
        const maxPaddlePos = newWidth - paddleWidth;
        return Math.min(Math.max(prevPaddlePos, 0), maxPaddlePos);
      });
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [paddleWidth]);

  const randomBallStart = () => {
    const randomX = Math.random() * (gameWidth - ballSize);
    const randomY = Math.random() * (gameHeight / 2);
    const randomDx = Math.random() > 0.5 ? 2 : -2;
    const randomDy = Math.random() > 0.5 ? 2 : -2;
    return { x: randomX, y: randomY, dx: randomDx, dy: randomDy };
  };

  const moveBall = () => {
    setBallPos((prev) => {
      let { x, y, dx, dy } = prev;

      if (x <= 0 || x >= gameWidth - ballSize) dx = -dx;
      if (y <= 0) dy = -dy;

      if (
        y + ballSize >= gameHeight - paddleHeight &&
        x >= paddlePos &&
        x <= paddlePos + paddleWidth
      ) {
        dy = -dy;
        setScore(score + 1);

        const ballCenter = x + ballSize / 2;
        const paddleCenter = paddlePos + paddleWidth / 2;
        const distanceFromCenter = ballCenter - paddleCenter;
        const maxDistance = paddleWidth / 2;

        const maxSpeedIncrease = 1.05;
        const speedFactor = 1 + Math.abs(distanceFromCenter) / maxDistance * 0.1;

        const newSpeedMultiplier = Math.min(speedMultiplier * speedFactor, maxSpeedIncrease);
        setSpeedMultiplier(newSpeedMultiplier);

        dx *= newSpeedMultiplier;
        dy *= newSpeedMultiplier;
      }

      if (y + ballSize >= gameHeight - paddleHeight) {
        if (x >= paddlePos && x <= paddlePos + paddleWidth) {
          y = gameHeight - paddleHeight - ballSize;
        }
      }

      if (y >= gameHeight) {
        const newLeaderboard = [...leaderboard, score].sort((a, b) => b - a).slice(0, 5);
        if (typeof window !== "undefined") {
          localStorage.setItem('leaderboard', JSON.stringify(newLeaderboard));
        }
        setLeaderboard(newLeaderboard);
        setScore(0);
        setSpeedMultiplier(1);
        // Réinitialiser les bouncers quand le joueur perd
        setDvdBouncers([]);
        return randomBallStart();
      }

      return { x: x + dx, y: y + dy, dx, dy };
    });
  };

  const movePaddle = (event) => {
    const newPos = Math.min(Math.max(event.clientX - paddleWidth / 2, 0), gameWidth - paddleWidth);
    setPaddlePos(newPos);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener('mousemove', movePaddle);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener('mousemove', movePaddle);
      }
    };
  }, [gameWidth]);

  useEffect(() => {
    setBallPos(randomBallStart());
  }, [gameWidth, gameHeight]);

  useEffect(() => {
    const interval = setInterval(moveBall, 10);
    return () => clearInterval(interval);
  }, [ballPos, score]);

  return (
    <div className='ok'>
      
      <div className="game-container" style={{ width: gameWidth, height: gameHeight }}>
        <div className="background-game" style={{ width: gameWidth, height: gameHeight }}></div>

        {/* Afficher tous les DVD bouncers du tableau */}
        {dvdBouncers.map((bouncer) => (
          <div 
            key={bouncer.id}
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              zIndex: 5,
              pointerEvents: 'none' // Pour que les clics passent à travers
            }}
          >
            <DVDBouncer 
              containerWidth={gameWidth} 
              containerHeight={gameHeight} 
              // On peut ajouter des propriétés différentes pour chaque bouncer si souhaité
              // Par exemple, différentes vitesses ou tailles
              initialX={Math.random() * gameWidth} 
              initialY={Math.random() * gameHeight}
            />
          </div>
        ))}

        <div className="scoreboard">
          <h2>Score: {score}</h2>
        </div>
        <div
          className="ball"
          style={{
            left: ballPos.x,
            top: ballPos.y,
            width: ballSize,
            height: ballSize,
            position: 'absolute',
            
            backgroundImage: 'url(https://media.licdn.com/dms/image/v2/D4D03AQEaWWajd253rw/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1704901487990?e=2147483647&v=beta&t=72OChZdJEe8-s3Lywwdhd_8HTwB2V8ralZ0ZDOnZIFM)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
        <div
          className="paddle"
          style={{
            left: paddlePos,
            width: paddleWidth,
            height: paddleHeight,
            backgroundImage: 'url(https://media.licdn.com/dms/image/v2/D4D03AQEk30DWoiasxg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1729598427364?e=2147483647&v=beta&t=5kaIV-Y7j9ZMKxhZ1pfqG5D6MvSYQc0J88XOumaD8ic)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
        <div className="leaderboard">
          <h3>Leaderboard</h3>
          <ul>
            {leaderboard.map((score, index) => (
              <li key={index}># {index + 1}: {score} points</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rainbow-text">
        WOOOO LE GAMING
      </div>
      <div className="container2">
        <div className="button-container">
          <Link to="/test">
            <button className='boutton'>Aller à la page de Tom</button>
          </Link>
        </div>
        <div className="button-container">
          <Link to="/foodtrucks">
            <button className='boutton'>foodtrucks</button>
          </Link>
        </div>
      </div>
      <div className="outside-game">
      </div>
    </div>
  );
};

export default App;