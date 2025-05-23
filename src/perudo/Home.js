import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import { resetGame, checkRoomExists, joinRoom, subscribeToGame } from './backend/gameService';

const Home = () => {
    const [showGame, setShowGame] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [roomExists, setRoomExists] = useState(false);

    useEffect(() => {
        // S'abonner aux mises à jour du jeu
        console.log('Subscribing to game updates...');
        const unsubscribe = subscribeToGame((gameData) => {
            console.log('Game state updated:', gameData);
            setRoomExists(gameData !== null);
        });

        return () => {
            console.log('Unsubscribing from game updates...');
            unsubscribe();
        };
    }, []);

    const handleBecomeHost = async () => {
        try {
            setIsLoading(true);
            setError(null);

            console.log('Resetting game as host...');
            await resetGame();
            console.log('Game reset complete');

            // Supprimer les données locales existantes
            localStorage.removeItem('perudoPlayerId');
            localStorage.removeItem('perudoPlayerName');
            localStorage.setItem('perudoIsHost', 'true');
            
            // Afficher le jeu
            setShowGame(true);
        } catch (error) {
            console.error('Erreur détaillée:', error);
            setError('Erreur lors de la réinitialisation. Veuillez réessayer. ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinGame = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Vérifier si la room existe toujours
            const exists = await checkRoomExists();
            if (!exists) {
                throw new Error('La partie n\'existe plus.');
            }

            // Supprimer les données locales existantes
            localStorage.removeItem('perudoPlayerId');
            localStorage.removeItem('perudoPlayerName');
            localStorage.setItem('perudoIsHost', 'false');
            
            // Afficher le jeu
            setShowGame(true);
        } catch (error) {
            console.error('Erreur détaillée:', error);
            setError('Erreur lors de la connexion. ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (showGame) {
        return <Game />;
    }

    return (
        <div className="perudo-app flex flex-col items-center justify-center min-h-screen text-white">
            <h1 className="perudo-title mb-8">Perudo Game</h1>
            <div className="flex flex-col gap-4">
                {!roomExists ? (
                    <button
                        onClick={handleBecomeHost}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded ${
                            isLoading 
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                    >
                        {isLoading ? 'Initialisation...' : 'Créer une partie'}
                    </button>
                ) : (
                    <button
                        onClick={handleJoinGame}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded ${
                            isLoading 
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                        }`}
                    >
                        {isLoading ? 'Connexion...' : 'Rejoindre la partie'}
                    </button>
                )}
            </div>
            {error && (
                <div className="text-red-500 mt-4 text-center max-w-md px-4">
                    {error}
                </div>
            )}
        </div>
    );
};

export default Home;