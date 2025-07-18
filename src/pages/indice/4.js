import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';

const Digit = ({ number }) => (
    <span className="digital7 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] select-none text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]">
        {number}
    </span>
);

const DigitalTime = ({ timeStr }) => (
    <div className="flex justify-center space-x-4 mb-8">
        {timeStr.split('').map((char, i) =>
            char === ':' ? (
                <span key={i} className="digital7 text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] select-none text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem]">
                    :
                </span>
            ) : (
                <Digit key={i} number={char} />
            )
        )}
    </div>
);


const IndicePage = () => {

    const fixedEndDate = new Date("2025-07-27T21:00:00Z");

    const [timeLeft, setTimeLeft] = useState(null);
    const [finished, setFinished] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const diff = fixedEndDate - now;

            if (diff <= 0) {
                setFinished(true);
                setTimeLeft(0);
            } else {
                setFinished(false);
                setTimeLeft(diff);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.play().catch((err) => {
                console.warn("Audio bloqué :", err);
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

    if (timeLeft === null) return <div className="text-white p-6">Chargement…</div>;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white text-center">
            {!finished ? (
                <>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl mb-4 text-red-500 select-none">
                        🕒 Indice dans
                    </h1>
                    <DigitalTime timeStr={formatTime(timeLeft)} />
                    <audio ref={audioRef} src="/theme.mp3" preload="auto" autoPlay loop />
                </>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-screen bg-yellow-900 text-white p-6">
                    <audio ref={audioRef} src="/fortboyard.mp3" preload="auto" autoPlay loop />
                    <h1 className="text-5xl font-extrabold mb-8 drop-shadow-[2px_2px_4px_rgba(0,0,0,0.9)] select-none" style={{ fontFamily: "'Impact', sans-serif" }}>
                        🔥 Indice 🔥
                    </h1>
                    <div className="bg-yellow-800 border-8 border-yellow-600 rounded-xl p-6 max-w-md w-full shadow-lg">
                        <h2 className="text-3xl font-bold mb-4 text-center drop-shadow-md">
                            Devinette du jour
                        </h2>
                        <p className="text-lg text-yellow-200 mb-6 text-center leading-relaxed">
                            À la cafet, deux fois la semaine,<br />
                            Un homme veille, discret, sans peine.<br />
                            Concierge de nom, gardien de passage,<br />
                            Il détient un test, pour les plus sages.<br />
                            Il ne crie pas, il ne court guère,<br />
                            Mais il te jauge, d’un air sévère.<br />
                            Si tu veux l’indice qu’il tient bien au chaud,<br />
                            Il faudra peser… mais pas au kilo !<br />
                            Trop lourd, tu perds. Trop léger, il se tait.<br />
                            Juste poids, et le mot te sera donné.<br />
                        </p>
                        {/* Emplacements pour images (exemple) */}
                    </div>
                    <a
                        href="https://o.fortboyard.tv/photos/photo_8307.jpg"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full h-auto block rounded-md border-4 border-yellow-500 overflow-hidden focus:outline-none"
                    >
                        <img
                            src="https://o.fortboyard.tv/photos/photo_8307.jpg"
                            alt="Description de l'image"
                            className="w-full h-full object-cover"
                        />
                    </a>

                </div>

            )}
        </div>
    );
};

Digit.propTypes = {
    number: PropTypes.string.isRequired,
};

DigitalTime.propTypes = {
    timeStr: PropTypes.string.isRequired,
};

export default IndicePage;
