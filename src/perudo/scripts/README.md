# Scripts d'initialisation Firestore pour Perudo

Ce dossier contient les scripts pour initialiser et gérer la base de données Firestore du jeu Perudo.

## Scripts disponibles

### 🚀 Initialisation complète (recommandé)
```bash
npm run perudo:reset
```
Effectue un reset complet : nettoie la base, initialise la structure, et crée une partie de test.

### 🏗️ Initialisation de la structure
```bash
npm run perudo:init
```
Initialise la structure de base de données avec les métadonnées.

### 🧹 Nettoyage de la base
```bash
npm run perudo:clean
```
Supprime toutes les données existantes dans la collection `games`.

### 🎮 Création d'une partie de test
```bash
npm run perudo:test
```
Crée une partie de test avec un joueur exemple.

## Structure de la base de données

### Collection `games`
- **Document ID**: `game_default` (room unique)
- **Structure**:
  ```javascript
  {
    status: 'waiting' | 'playing' | 'finished',
    createdBy: 'string (player ID)',
    currentPlayer: 'string (player ID)',
    lastAction: {
      type: 'bid' | 'challenge' | 'calza',
      player: 'string (player ID)',
      value: number,
      count: number,
      timestamp: Timestamp
    },
    players: [{
      id: 'string',
      name: 'string',
      diceCount: number,
      dice: [number, number, ...],
      isReady: boolean,
      lastSeen: Timestamp,
      isCreator: boolean
    }],
    round: number,
    lastUpdate: Timestamp,
    createdAt: Timestamp,
    hostLastSeen: Timestamp
  }
  ```

### Document `_metadata`
Contient les informations sur la version et la structure de la base.

## Utilisation

1. **Première installation** :
   ```bash
   npm run perudo:reset
   ```

2. **Développement** :
   - Pour nettoyer entre les tests : `npm run perudo:clean`
   - Pour créer une nouvelle partie de test : `npm run perudo:test`

3. **Production** :
   ```bash
   npm run perudo:init
   ```

## Logs

Les scripts affichent des logs détaillés avec des emojis pour faciliter le suivi :
- 🚀 Démarrage
- 🔍 Test de connexion
- 🏗️ Initialisation
- 🧹 Nettoyage
- 🎮 Création de partie test
- ✅ Succès
- ❌ Erreur

## Dépannage

Si vous rencontrez des erreurs :

1. **Erreur de connexion** :
   - Vérifiez votre configuration Firebase dans `config.js`
   - Vérifiez votre connexion internet

2. **Erreur de permissions** :
   - Vérifiez les règles Firestore dans la console Firebase
   - Assurez-vous que les permissions en lecture/écriture sont configurées

3. **Erreur de modules** :
   - Vérifiez que Firebase est installé : `npm install firebase`

## Configuration Firebase

Le script utilise la même configuration que l'application :
- Project ID: `perudo-9b0e7`
- Collection: `games`
- Room ID: `game_default`