import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

export default function DVDBouncer({ containerWidth, containerHeight }) {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [velocity, setVelocity] = useState({ x: 2, y: 2 });
  const [color, setColor] = useState('#ff0000');
  
  // Liste de couleurs pour le changement aléatoire
  const colors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
    '#ff00ff', '#00ffff', '#ff8000', '#8000ff'
  ];
  
  // Fonction pour changer la couleur aléatoirement
  const changeColor = () => {
    const newColor = colors[Math.floor(Math.random() * colors.length)];
    setColor(newColor);
  };
  
  // Référence pour l'animation
  const animationRef = useRef(null);
  
  // Réinitialiser la position quand les dimensions changent
  useEffect(() => {
    // Position aléatoire au début
    setPosition({
      x: Math.random() * (containerWidth - 100),
      y: Math.random() * (containerHeight - 50)
    });
    
    // Assurez-vous que l'ancienne animation est annulée
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, [containerWidth, containerHeight]);
  
  // Animation principale
  useEffect(() => {
    if (!containerWidth || !containerHeight) return;
    
    const logoWidth = 400;
    const logoHeight = 200;
    
    const animate = () => {
      setPosition(prevPos => {
        let newX = prevPos.x + velocity.x;
        let newY = prevPos.y + velocity.y;
        let newVelX = velocity.x;
        let newVelY = velocity.y;
        let shouldChangeColor = false;
        
        // Collision avec les bords horizontaux
        if (newX <= 0 || newX + logoWidth >= containerWidth) {
          newVelX = -newVelX;
          shouldChangeColor = true;
        }
        
        // Collision avec les bords verticaux
        if (newY <= 0 || newY + logoHeight >= containerHeight) {
          newVelY = -newVelY;
          shouldChangeColor = true;
        }
        
        // Si on a touché un bord, on change la couleur
        if (shouldChangeColor) {
          changeColor();
        }
        
        // Mise à jour de la vélocité si nécessaire
        if (newVelX !== velocity.x || newVelY !== velocity.y) {
          setVelocity({ x: newVelX, y: newVelY });
        }
        
        return {
          x: Math.max(0, Math.min(containerWidth - logoWidth, newX)),
          y: Math.max(0, Math.min(containerHeight - logoHeight, newY))
        };
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    // Nettoyage à la fin
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [velocity, containerWidth, containerHeight]);
  
  return (
    <div 
      className="dvd-logo absolute"
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        width: '100px',
        height: '50px',
        backgroundColor: color,
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '1.25rem',
        position: 'absolute',
        zIndex: 5,
        pointerEvents: 'none',
      }}
    >
      <span style={{ color: 'white' }}>DVD</span>
    </div>
  );
}

DVDBouncer.propTypes = {
  containerWidth: PropTypes.number.isRequired,
  containerHeight: PropTypes.number.isRequired,
};