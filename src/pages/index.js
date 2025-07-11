import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import DVDBouncer from '../comp/DVDBouncer';

const App = () => {

  const [ballPos, setBallPos] = useState({ x: 50, y: 50, dx: 5, dy: 2 });
  const [paddlePos, setPaddlePos] = useState(50);
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [gameWidth, setGameWidth] = useState(0);
  const [gameHeight, setGameHeight] = useState(0);

  const ballSize = 50;
  const paddleWidth = 100;
  const paddleHeight = 10;

  const [isTouching, setIsTouching] = useState(false);
  const [isBallInitialized, setIsBallInitialized] = useState(false);


  const [speedMultiplier, setSpeedMultiplier] = useState(1);


  const [currentImage, setCurrentImage] = useState(null);

  const [showImage, setShowImage] = useState(false);


  const [dvdBouncers, setDvdBouncers] = useState([]);


  useEffect(() => {
    const bouncersCount = Math.floor(score / 2);
    if (bouncersCount > dvdBouncers.length) {
      const newBouncers = [...dvdBouncers];
      for (let i = dvdBouncers.length; i < bouncersCount; i++) {
        newBouncers.push({ id: i, x: Math.random() * gameWidth, y: Math.random() * gameHeight });
      }
      setDvdBouncers(newBouncers); 
    }
}, [score, dvdBouncers]);


  useEffect(() => {

    if (score === 5) {
      setCurrentImage("/image00001.jpeg");
      setShowImage(true);
    } else if (score === 10) {
      setCurrentImage("/image00002.jpeg");
      setShowImage(true);
    } else if (score === 20) {
      setCurrentImage("/image00003.jpeg");
      setShowImage(true);
    } else {


      if (showImage) {
        setShowImage(false);
      }
      return;
    }


    if (showImage) {
      const timer = setTimeout(() => {
        setShowImage(false);
      }, 500);


      return () => clearTimeout(timer);
    }
  }, [score, showImage]);

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
  }, []);


  useEffect(() => {
    if (gameWidth > 0 && gameHeight > 0 && !isBallInitialized) {
      setBallPos(randomBallStart());
      setIsBallInitialized(true);
    }
  }, [gameWidth, gameHeight, isBallInitialized]);


  const moveBall = () => {
    setBallPos((prev) => {
      let { x, y, dx, dy } = prev;
  
      // Vérifier la collision avec les bords gauche et droit de l'écran
      if (x <= 0 || x >= gameWidth - ballSize) {
        dx = -dx; // Inverser la direction horizontale si la balle touche un bord
      }
  
      // Vérifier la collision avec le bord supérieur de l'écran
      if (y <= 0) {
        dy = -dy; // Inverser la direction verticale si la balle touche le haut
      }
  
      // Vérifier la collision avec la barre (tout le côté de la barre, y compris les bords)
      // La balle doit être à peu près au niveau de la barre et dans la largeur de la barre
      if (
        y + ballSize >= gameHeight - paddleHeight &&  // La balle touche le bas de l'écran où la barre est située
        x + ballSize > paddlePos &&                    // La balle touche la partie droite de la barre
        x < paddlePos + paddleWidth                    // La balle touche la partie gauche de la barre
      ) {
        dy = -dy; // La balle rebondit en inversant sa direction verticale
  
        // Optionnel: ajout de la logique pour augmenter la vitesse en fonction de l'impact
        setScore(score + 1); // Augmenter le score à chaque rebond
  
        const ballCenter = x + ballSize / 2;         // Position du centre de la balle
        const paddleCenter = paddlePos + paddleWidth / 2;  // Position du centre de la barre
        const distanceFromCenter = ballCenter - paddleCenter;
        const maxDistance = paddleWidth / 2;           // Largeur maximale sur laquelle la balle peut toucher
  
        // Calcul de la vitesse en fonction de l'endroit où la balle touche la barre
        const speedFactor = 1 + Math.abs(distanceFromCenter) / maxDistance * 0.1;
        dx *= speedFactor; // Appliquer la vitesse horizontale
        dy *= speedFactor; // Appliquer la vitesse verticale
      }
  
      // Si la balle passe sous la barre (game over)
      if (y + ballSize >= gameHeight) {
        // Mettre à jour le leaderboard et réinitialiser le jeu
        const newLeaderboard = [...leaderboard, score].sort((a, b) => b - a).slice(0, 5);
        if (typeof window !== "undefined") {
          localStorage.setItem('leaderboard', JSON.stringify(newLeaderboard));
        }
        setLeaderboard(newLeaderboard);
        setScore(0);
        setSpeedMultiplier(1);
        setDvdBouncers([]);
        return randomBallStart();  // Repartir avec une nouvelle balle au départ
      }
  
      return { x: x + dx, y: y + dy, dx, dy };
    });
  };
  


  const randomBallStart = () => {
    const safeWidth = Math.max(gameWidth, ballSize);
    const safeHeight = Math.max(gameHeight, ballSize);

    const randomX = Math.random() * (safeWidth - ballSize);
    const randomY = Math.random() * (safeHeight / 2);
    const randomDx = Math.random() > 0.5 ? 2 : -2;
    const randomDy = Math.random() > 0.5 ? 2 : -2;
    return { x: randomX, y: randomY, dx: randomDx, dy: randomDy };
  };


  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameWidth]);

  const handleTouchMove = (event) => {
    event.preventDefault();
    const touchX = event.touches[0].clientX;
    const newPos = Math.min(Math.max(touchX - paddleWidth / 2, 0), gameWidth - paddleWidth);
    setPaddlePos(newPos);
  };


  const handleTouchStart = (event) => {
    event.preventDefault();
  };


  const handleTouchEnd = () => {
  };

  const handleMouseMove = (event) => {
    const newPos = Math.min(Math.max(event.clientX - paddleWidth / 2, 0), gameWidth - paddleWidth);
    setPaddlePos(newPos);
  };

  useEffect(() => {
    if (isBallInitialized) {
      const interval = setInterval(moveBall, 10);
      return () => clearInterval(interval);
    }
  }, [isBallInitialized, ballPos, score]);

  return (
    <div className='ok' style={{
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    maxHeight: '100vh'
  }}>

      <div className="game-container" style={{ width: gameWidth, height: gameHeight, position: 'relative' }}>
        <div className="background-game" style={{ width: gameWidth, height: gameHeight }}></div>

        { }
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
              pointerEvents: 'none'
            }}
          >
            <DVDBouncer
              containerWidth={gameWidth + 300}
              containerHeight={gameHeight}
              initialX={Math.random() * gameWidth}
              initialY={Math.random() * gameHeight}
            />
          </div>
        ))}

        { }
        {showImage && currentImage && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              width: '150px',
              height: '150px',
            }}
          >
            <img
              src={currentImage}
              alt="Milestone achievement"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        )}

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
            position: 'absolute',
            borderRadius: '70px',
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

      <div className="rainbow-text">WOOOO LE GAMING</div>

      <div className="container2">
        <div className="button-container">
          <Link to="/test">
            <button className='boutton'>Aller à la page de Tom</button>
          </Link>
        </div>
        <div className="button-container">
          <Link to="/samule">
            <button className='boutton'>Samule</button>
          </Link>
        </div>
        <div className="button-container">
          <Link to="/foodtrucks">
            <button className='boutton'>foodtrucks</button>
          </Link>
        </div>
      </div>
      <div className="button-container">
          <Link to="/perudo">
            <button className='boutton'>perudo</button>
          </Link>
        </div>
      <div className="button-container">
        <Link to="/leak">
          <button className="boutton button-leak"> Laisse feur c'est bien</button>
        </Link>
      </div>

      <div className="outside-game">
        <Link to="/gaben">
          <button className="fixed-button"> ?????</button>
        </Link>
      </div>

    </div>
  );
};

export default App;
