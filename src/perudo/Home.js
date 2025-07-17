import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import Button from './components/Button';
import { subscribeToGame, joinOrCreateLobby } from './backend/gameService';
import { generatePlayerId, getSavedPlayerName, savePlayerName } from './utils/deviceId';

const Home = () => {
    const [gameData, setGameData] = useState(null);
    const [playerName, setPlayerName] = useState('');
    const [playerId, setPlayerId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Charger le nom sauvegardé au démarrage
        const savedName = getSavedPlayerName();
        if (savedName) {
            setPlayerName(savedName);
        }

        console.log('🏠 [Home] Setting up game listener');
        const unsubscribe = subscribeToGame((data) => {
            console.log('🏠 [Home] Game state changed:', data ? 'exists' : 'null');
            setGameData(data);
        });

        return () => {
            console.log('🏠 [Home] Cleaning up game listener');
            unsubscribe();
        };
    }, []);

    const handleJoinOrCreate = async () => {
        if (!playerName.trim()) {
            setError('Veuillez entrer votre nom');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            console.log('🏠 [Home] Joining or creating lobby...');
            
            // Générer un ID persistant basé sur le device et le nom du joueur
            const generatedPlayerId = generatePlayerId(playerName.trim());
            setPlayerId(generatedPlayerId);
            
            // Sauvegarder le nom du joueur
            savePlayerName(playerName.trim());
            
            const gameData = await joinOrCreateLobby({
                id: generatedPlayerId,
                name: playerName.trim()
            });
            console.log('🏠 [Home] Manual connect successful, gameData:', gameData ? 'exists' : 'null');
            
            console.log('🏠 [Home] Successfully joined/created lobby');
            
        } catch (error) {
            console.error('🏠 [Home] Error:', error);
            setError(error.message || 'Erreur de connexion');
        } finally {
            setIsLoading(false);
        }
    };

    // Si il y a des données de jeu, afficher le composant Game (lobby ou jeu)
    if (gameData && playerId) {
        return <Game gameData={gameData} playerId={playerId} playerName={playerName} />;
    }

    // Si on est en train de charger et qu'on a un playerId, afficher un état de chargement
    if (isLoading && playerId) {
        return (
            <div className="perudo-app flex flex-col items-center justify-center min-h-screen text-white">
                <div className="animate-pulse text-xl">Connexion au lobby...</div>
            </div>
        );
    }

    return (
        <div className="perudo-app flex flex-col items-center justify-center min-h-screen text-white">
            <h1 className="perudo-title mb-8">Perudo Game</h1>
            <div className="flex flex-col gap-4 w-full max-w-md px-4">
                <input
                    type="text"
                    placeholder="Votre nom"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="px-4 py-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinOrCreate()}
                />
                <Button
                    onClick={handleJoinOrCreate}
                    disabled={isLoading || !playerName.trim()}
                >
                    {isLoading ? 'Connexion...' : 'Rejoindre/Créer le lobby'}
                </Button>
                <div className="text-sm text-gray-400 text-center">
                    Entrez votre nom pour rejoindre automatiquement<br />
                    le lobby existant ou en créer un nouveau
                </div>
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