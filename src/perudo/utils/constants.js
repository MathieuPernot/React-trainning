// Game constants
export const GAME_CONFIG = {
  TURN_TIMEOUT: 30000, // 30 secondes
  HEARTBEAT_INTERVAL: 30000, // 30 secondes
  HOST_TIMEOUT: 60000, // 1 minute
  INACTIVE_TIMEOUT: 300000, // 5 minutes
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2,
  INITIAL_DICE: 5,
  MAX_DICE_VALUE: 6,
  MIN_DICE_VALUE: 1,
  MAX_BID_COUNT: 50
};

export const GAME_STATUS = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FINISHED: 'finished'
};

export const ACTION_TYPES = {
  GAME_START: 'game_start',
  BID: 'bid',
  CHALLENGE: 'challenge',
  CALZA: 'calza'
};

export const FIREBASE_CONFIG = {
  GAME_COLLECTION: 'games',
  ROOM_ID: 'perudo-room'
};

export const STORAGE_KEYS = {
  DEVICE_ID: 'perudo_device_id',
  PLAYER_NAME: 'perudo_player_name'
};