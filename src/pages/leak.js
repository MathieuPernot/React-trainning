import React, { useEffect, useState, useRef } from "react";

const Digit = ({ number }) => (
  <span className="digital7 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] select-none text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]">
    {number}
  </span>
);

const DigitalTime = ({ timeStr }) => (
  <div className="flex space-x-4 justify-center">
    {timeStr.split("").map((char, i) =>
      char === ":" ? (
        <span
          key={i}
          className="digital7 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] select-none text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]"
        >
          :
        </span>
      ) : (
        <Digit key={i} number={char} />
      )
    )}
  </div>
);

const BombTimer = () => {
  const targetDate = new Date("2025-07-11T20:59:59").getTime();
  const [timeLeft, setTimeLeft] = useState(targetDate - Date.now());
  const [finished, setFinished] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        clearInterval(interval);
        setFinished(true);
      } else {
        setTimeLeft(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  // Lecture automatique si possible
  useEffect(() => {
    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Lecture OK
          })
          .catch((error) => {
            console.warn("Lecture audio bloquée par le navigateur", error);
          });
      }
    }
  }, []);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
      <h1 className="digital7 text-red-500 select-none mb-12 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
        💣 Vos réponses arrivent 💣
      </h1>

      {!finished ? (
        <>
          <DigitalTime timeStr={formatTime(timeLeft)} />
          <audio ref={audioRef} src="/theme.mp3" preload="auto" autoPlay loop />
        </>
      ) : (
        <div className="text-red-600 select-none animate-bounce text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]">
          💥 BOUM ! 💥
        </div>
      )}
    </div>
  );
};

export default BombTimer;
