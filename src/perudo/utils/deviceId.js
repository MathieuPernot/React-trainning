// Utilitaires pour générer et gérer un ID de device persistant

// Génère un hash simple à partir d'une chaîne
const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convertit en 32bit integer
    }
    return Math.abs(hash).toString(36);
};

// Collecte les métadonnées du navigateur/device
const getDeviceFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvasFingerprint: canvas.toDataURL(),
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1
    };
    
    // Combine toutes les données en une chaîne
    const combined = Object.values(fingerprint).join('|');
    return simpleHash(combined);
};

// Génère ou récupère un ID de device persistant
export const getDeviceId = () => {
    const STORAGE_KEY = 'perudo_device_id';
    
    // Tenter de récupérer l'ID existant
    let deviceId = localStorage.getItem(STORAGE_KEY);
    
    if (!deviceId) {
        // Créer un nouvel ID basé sur le fingerprint + timestamp
        const fingerprint = getDeviceFingerprint();
        const timestamp = Date.now().toString(36);
        deviceId = `device_${fingerprint}_${timestamp}`;
        
        // Sauvegarder dans localStorage
        localStorage.setItem(STORAGE_KEY, deviceId);
    }
    
    return deviceId;
};

// Génère un ID de joueur unique basé sur le device et le nom
export const generatePlayerId = (playerName) => {
    const deviceId = getDeviceId();
    const nameHash = simpleHash(playerName.toLowerCase());
    return `${deviceId}_${nameHash}`;
};

// Récupère le nom du joueur sauvegardé pour ce device
export const getSavedPlayerName = () => {
    return localStorage.getItem('perudo_player_name') || '';
};

// Sauvegarde le nom du joueur pour ce device
export const savePlayerName = (name) => {
    localStorage.setItem('perudo_player_name', name);
};

