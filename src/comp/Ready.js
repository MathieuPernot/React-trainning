import React, { useRef, useState } from 'react';

const Ready = () => {
  const [showPopup, setShowPopup] = useState(true);
  const [showText, setShowText] = useState(false);
  const audioRef = useRef(null);

  const handleStart = async () => {
    try {
      await audioRef.current.play();
      setShowPopup(false);
      setShowText(true);
    } catch (error) {
      console.error("Erreur lors de la lecture de la musique :", error);
    }
  };

  return (
    <div className="w-screen h-screen bg-gradient-to-br from-[#1a120b] to-[#3e2c1e] text-white flex items-center justify-center relative font-serif">
      <audio ref={audioRef} src="/fortboyard.mp3" preload="auto" loop />

      {showPopup && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-10 p-4">
          <div className="bg-[#2d1b10] border-4 border-yellow-700 rounded-xl p-6 shadow-2xl text-center max-w-md w-full space-y-4">
            <h2 className="text-2xl font-bold text-yellow-500 tracking-wide">
              Êtes-vous prêt ?
            </h2>
            <p className="text-sm text-gray-300">(Activez la musique)</p>
            <button
              onClick={handleStart}
              className="mt-4 bg-yellow-700 hover:bg-yellow-600 text-black font-bold py-2 px-6 rounded-full border border-yellow-900 shadow-md transition duration-300 ease-in-out uppercase tracking-wide"
            >
              Oui, commencer
            </button>
          </div>
        </div>
      )}

      {showText && (
        <div className="text-5xl sm:text-7xl font-extrabold text-yellow-400 animate-fade-in drop-shadow-[0_0_20px_rgba(255,215,0,0.8)] text-center px-4">
          HELLO
        </div>
      )}
    </div>
  );
};

export default Ready;
