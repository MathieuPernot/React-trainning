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
  const paddleWidth = 150;
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
        newBouncers.push({ id: i });
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

        setDvdBouncers([]);
        return randomBallStart();
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

  const handleTouchStart = (event) => {
    const touchY = event.touches[0].clientY;
    const newPos = Math.min(Math.max(touchY - paddleHeight / 2, 0), gameHeight - paddleHeight);
    setPaddlePos(newPos);
    setIsTouching(true);
  };

  const handleTouchMove = (event) => {
    if (!isTouching) return;
    const touchY = event.touches[0].clientY;
    const newPos = Math.min(Math.max(touchY - paddleHeight / 2, 0), gameHeight - paddleHeight);
    setPaddlePos(newPos);
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
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
    <div className='ok'>

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
              containerWidth={gameWidth}
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
          <Link to="/foodtrucks">
            <button className='boutton'>foodtrucks</button>
          </Link>
        </div>
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
