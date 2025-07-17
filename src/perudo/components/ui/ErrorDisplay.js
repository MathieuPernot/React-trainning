import React from 'react';

// Composant pour afficher les erreurs
const ErrorDisplay = ({ error, onClose, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 p-4 bg-red-900 text-white rounded-lg shadow-lg ${className}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <strong>Erreur:</strong> {error}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-red-200 hover:text-white focus:outline-none"
            aria-label="Fermer l'erreur"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;