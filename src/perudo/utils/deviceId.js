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

// Génère un ID aléatoire sécurisé
const generateSecureRandomId = () => {
    // Utiliser crypto.getRandomValues si disponible, sinon Math.random avec plus d'entropie
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const array = new Uint32Array(2);
        window.crypto.getRandomValues(array);
        return array[0].toString(36) + array[1].toString(36);
    } else {
        // Fallback avec plus d'entropie
        return Math.random().toString(36).substring(2) + 
               Math.random().toString(36).substring(2) + 
               Date.now().toString(36);
    }
};

// Génère ou récupère un ID de device persistant
export const getDeviceId = () => {
    const STORAGE_KEY = 'perudo_device_id';
    
    // Tenter de récupérer l'ID existant
    let deviceId = localStorage.getItem(STORAGE_KEY);
    
    if (!deviceId) {
        // Créer un nouvel ID avec plus d'entropie
        const fingerprint = getDeviceFingerprint();
        const timestamp = Date.now().toString(36);
        const randomId = generateSecureRandomId();
        const sessionId = Math.random().toString(36).substring(2);
        
        deviceId = `device_${fingerprint}_${timestamp}_${randomId}_${sessionId}`;
        
        // Sauvegarder dans localStorage
        localStorage.setItem(STORAGE_KEY, deviceId);
    }
    
    return deviceId;
};

// Génère un ID de joueur unique basé sur le device et le nom
export const generatePlayerId = (playerName) => {
    const deviceId = getDeviceId();
    const nameHash = simpleHash(playerName.toLowerCase());
    const sessionRandom = Math.random().toString(36).substring(2);
    const microTime = (Date.now() + Math.random()).toString(36);
    
    return `${deviceId}_${nameHash}_${sessionRandom}_${microTime}`;
};

// Récupère le nom du joueur sauvegardé pour ce device
export const getSavedPlayerName = () => {
    return localStorage.getItem('perudo_player_name') || '';
};

// Sauvegarde le nom du joueur pour ce device
export const savePlayerName = (name) => {
    localStorage.setItem('perudo_player_name', name);
};

// Force la génération d'un nouvel ID (en cas de collision)
export const forceNewDeviceId = () => {
    const STORAGE_KEY = 'perudo_device_id';
    localStorage.removeItem(STORAGE_KEY);
    return getDeviceId(); // Génère un nouvel ID
};

// Debug: obtenir les informations détaillées de l'ID
export const getDeviceIdInfo = () => {
    const deviceId = getDeviceId();
    const parts = deviceId.split('_');
    
    return {
        fullId: deviceId,
        fingerprint: parts[1],
        timestamp: parts[2] ? parseInt(parts[2], 36) : null,
        timestampDate: parts[2] ? new Date(parseInt(parts[2], 36)) : null,
        randomPart: parts[3],
        sessionPart: parts[4]
    };
};

