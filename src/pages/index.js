import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const App = () => {
  const ballRef = useRef(null);
  const paddleRef = useRef(null);

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

  // Resize handler to adjust the game size
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

  // Initialize the ball when game size is set
  useEffect(() => {
    if (gameWidth > 0 && gameHeight > 0 && !isBallInitialized) {
      setBallPos(randomBallStart());
      setIsBallInitialized(true); // Mark ball as initialized
    }
  }, [gameWidth, gameHeight, isBallInitialized]);

  // Move the ball
  const moveBall = () => {
    setBallPos((prev) => {
      let { x, y, dx, dy } = prev;

      // Collision with the walls (left and right)
      if (x <= 0) {
        dx = Math.abs(dx);
        x = 0;
      } else if (x + ballSize >= gameWidth) {
        dx = -Math.abs(dx);
        x = gameWidth - ballSize;
      }

      // Collision with the top
      if (y <= 0) {
        dy = Math.abs(dy);
        y = 0;
      }

      // Collision with the paddle
      if (
        y + ballSize >= gameHeight - paddleHeight &&
        x + ballSize >= paddlePos &&
        x <= paddlePos + paddleWidth
      ) {
        dy = -Math.abs(dy);
        y = gameHeight - paddleHeight - ballSize;
        setScore(score + 1);
      }

      // If the ball falls out of the screen (bottom)
      if (y + ballSize >= gameHeight) {
        const newLeaderboard = [...leaderboard, score].sort((a, b) => b - a).slice(0, 5);
        if (typeof window !== "undefined") {
          localStorage.setItem('leaderboard', JSON.stringify(newLeaderboard));
        }
        setLeaderboard(newLeaderboard);
        setScore(0);
        return randomBallStart();
      }

      return { x: x + dx, y: y + dy, dx, dy };
    });
  };

  // Start the ball at a random position
  const randomBallStart = () => {
    const safeWidth = Math.max(gameWidth, ballSize);
    const safeHeight = Math.max(gameHeight, ballSize);

    const randomX = Math.random() * (safeWidth - ballSize);
    const randomY = Math.random() * (safeHeight / 2);
    const randomDx = Math.random() > 0.5 ? 2 : -2;
    const randomDy = Math.random() > 0.5 ? 2 : -2;
    return { x: randomX, y: randomY, dx: randomDx, dy: randomDy };
  };

  // Event listeners for touch and mouse events
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

  // Touch event handlers for mobile
  const handleTouchStart = (event) => {
    const touchX = event.touches[0].clientX;
    const newPos = Math.min(Math.max(touchX - paddleWidth / 2, 0), gameWidth - paddleWidth);
    setPaddlePos(newPos);
    setIsTouching(true);
  };

  const handleTouchMove = (event) => {
    if (!isTouching) return;
    const touchX = event.touches[0].clientX;
    const newPos = Math.min(Math.max(touchX - paddleWidth / 2, 0), gameWidth - paddleWidth);
    setPaddlePos(newPos);
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
  };

  // Mouse event handlers for desktop
  const handleMouseMove = (event) => {
    const newPos = Math.min(Math.max(event.clientX - paddleWidth / 2, 0), gameWidth - paddleWidth);
    setPaddlePos(newPos);
  };

  // Start the movement when the ball is initialized
  useEffect(() => {
    if (isBallInitialized) {
      const interval = setInterval(moveBall, 10);
      return () => clearInterval(interval);
    }
  }, [isBallInitialized, ballPos, score]);

  return (
    <div className='ok'>
      <div className="game-container" style={{ width: gameWidth, height: gameHeight }}>
        <div className="background-game" style={{ width: gameWidth, height: gameHeight }}></div>

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
