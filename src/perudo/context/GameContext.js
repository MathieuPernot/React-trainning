import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { GAME_STATUS } from '../utils/constants';

const GameContext = createContext();

// Actions pour le reducer
const GAME_ACTIONS = {
  SET_GAME_STATE: 'SET_GAME_STATE',
  UPDATE_PLAYERS: 'UPDATE_PLAYERS',
  SET_CURRENT_PLAYER: 'SET_CURRENT_PLAYER',
  SET_LAST_ACTION: 'SET_LAST_ACTION',
  SET_STATUS: 'SET_STATUS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  RESET_GAME: 'RESET_GAME'
};

// État initial du jeu
const initialState = {
  gameData: null,
  players: [],
  currentPlayer: null,
  lastAction: null,
  status: GAME_STATUS.WAITING,
  round: 1,
  createdBy: null,
  isLoading: false,
  error: null
};

// Reducer pour gérer les actions du jeu
const gameReducer = (state, action) => {
  switch (action.type) {
    case GAME_ACTIONS.SET_GAME_STATE:
      return {
        ...state,
        gameData: action.payload,
        players: action.payload?.players || [],
        currentPlayer: action.payload?.currentPlayer || null,
        lastAction: action.payload?.lastAction || null,
        status: action.payload?.status || GAME_STATUS.WAITING,
        round: action.payload?.round || 1,
        createdBy: action.payload?.createdBy || null,
        error: null
      };
    
    case GAME_ACTIONS.UPDATE_PLAYERS:
      return {
        ...state,
        players: action.payload,
        gameData: state.gameData ? { ...state.gameData, players: action.payload } : null
      };
    
    case GAME_ACTIONS.SET_CURRENT_PLAYER:
      return {
        ...state,
        currentPlayer: action.payload,
        gameData: state.gameData ? { ...state.gameData, currentPlayer: action.payload } : null
      };
    
    case GAME_ACTIONS.SET_LAST_ACTION:
      return {
        ...state,
        lastAction: action.payload,
        gameData: state.gameData ? { ...state.gameData, lastAction: action.payload } : null
      };
    
    case GAME_ACTIONS.SET_STATUS:
      return {
        ...state,
        status: action.payload,
        gameData: state.gameData ? { ...state.gameData, status: action.payload } : null
      };
    
    case GAME_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case GAME_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    
    case GAME_ACTIONS.RESET_GAME:
      return {
        ...initialState
      };
    
    default:
      return state;
  }
};

// Provider du contexte
export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Actions du jeu
  const actions = {
    setGameState: (gameData) => {
      dispatch({ type: GAME_ACTIONS.SET_GAME_STATE, payload: gameData });
    },
    
    updatePlayers: (players) => {
      dispatch({ type: GAME_ACTIONS.UPDATE_PLAYERS, payload: players });
    },
    
    setCurrentPlayer: (playerId) => {
      dispatch({ type: GAME_ACTIONS.SET_CURRENT_PLAYER, payload: playerId });
    },
    
    setLastAction: (action) => {
      dispatch({ type: GAME_ACTIONS.SET_LAST_ACTION, payload: action });
    },
    
    setStatus: (status) => {
      dispatch({ type: GAME_ACTIONS.SET_STATUS, payload: status });
    },
    
    setLoading: (loading) => {
      dispatch({ type: GAME_ACTIONS.SET_LOADING, payload: loading });
    },
    
    setError: (error) => {
      dispatch({ type: GAME_ACTIONS.SET_ERROR, payload: error });
    },
    
    resetGame: () => {
      dispatch({ type: GAME_ACTIONS.RESET_GAME });
    }
  };

  // Valeurs dérivées
  const derivedValues = {
    isWaiting: state.status === GAME_STATUS.WAITING,
    isPlaying: state.status === GAME_STATUS.PLAYING,
    isFinished: state.status === GAME_STATUS.FINISHED,
    activePlayers: state.players.filter(p => p.diceCount > 0),
    totalDice: state.players.reduce((sum, p) => sum + (p.diceCount || 0), 0),
    playerCount: state.players.length
  };

  const value = {
    ...state,
    ...derivedValues,
    actions
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

// Hook pour utiliser le contexte du jeu
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export { GAME_ACTIONS };