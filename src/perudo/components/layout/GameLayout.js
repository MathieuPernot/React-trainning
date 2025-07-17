import React from 'react';
import ErrorBoundary from '../ErrorBoundary';

// Layout principal pour le jeu
const GameLayout = ({ children }) => {
  return (
    <ErrorBoundary onRetry={() => window.location.reload()}>
      <div className="perudo-app min-h-screen bg-gray-900 text-white">
        {children}
      </div>
    </ErrorBoundary>
  );
};

export default GameLayout;