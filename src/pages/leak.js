import React, { useEffect, useState, useRef } from "react";
import dynamic from 'next/dynamic';

const Ready = dynamic(() => import('../comp/Ready'), { ssr: false });

const Digit = ({ number }) => (
  <span className="digital7 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] select-none text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]">
    {number}
  </span>
);

const DigitalTime = ({ timeStr }) => (
  <div className="flex justify-center space-x-4">
    {timeStr.split("").map((char, i) =>
      char === ":" ? (
        <span key={i} className="digital7 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] select-none text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]">
          :
        </span>
      ) : (
        <Digit key={i} number={char} />
      )
    )}
  </div>
);

const BombTimer = () => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [finished, setFinished] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchTimer = async () => {
      try {
        const res = await fetch('/api/timer');
        const data = await res.json();
        setFinished(data.finished);
        setTimeLeft(data.timeLeft);
      } catch (err) {
        console.error("Erreur lors du fetch du timer", err);
      }
    };

    fetchTimer();

    const interval = setInterval(fetchTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.warn("Lecture audio bloquée :", err);
      });
    }
  }, []);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  if (timeLeft === null) {
    return <div className="text-white p-6">Chargement…</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-white bg-black">
      {!finished ? (
        <div>
          <h1 className="text-red-500 select-none mb-12 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
            💣 CHAAAIIII 💣
          </h1>
          <DigitalTime timeStr={formatTime(timeLeft)} />
          <audio ref={audioRef} src="/theme.mp3" preload="auto" autoPlay loop />
        </div>
      ) : (
        <div className="countdown-finished">
          <WordLock />
        </div>
      )}
    </div>
  );
};

export default BombTimer;
