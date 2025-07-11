// Countdown.jsx
import React, { useEffect, useState } from 'react';

const Leak = () => {
  const targetDate = new Date("2025-07-11T20:59:59").getTime();
  const [timeLeft, setTimeLeft] = useState(targetDate - Date.now());
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const distance = targetDate - now;

      if (distance <= 0) {
        clearInterval(interval);
        setFinished(true);
      } else {
        setTimeLeft(distance);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const getTimeParts = (milliseconds) => {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  const { days, hours, minutes, seconds } = getTimeParts(timeLeft);

  return (
    <div className="countdown-container">
      <h1 className="countdown-title">Compte à rebours</h1>
      {!finished ? (
        <div className="countdown-box">
          {hours}h {minutes}m {seconds}s
        </div>
      ) : (
        <div className="countdown-finished">
          🎉 Temps écoulé !<br />
          <span style={{ color: "#007700" }}>Bonne année ! 🎆</span>
        </div>
      )}
    </div>
  );
};

export default Leak;
