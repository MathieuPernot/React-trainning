import React from 'react';

// Composant Button réutilisable
const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  style = {}, 
  className = '',
  type = 'button',
  ...props 
}) => {
  const baseStyles = {
    padding: '0.75rem 1.5rem',
    backgroundColor: disabled ? '#6b7280' : (style.backgroundColor || '#3b82f6'),
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s ease-in-out',
    opacity: disabled ? 0.5 : 1,
    ...style
  };

  const hoverStyles = !disabled ? {
    filter: 'brightness(1.1)',
    transform: 'translateY(-1px)'
  } : {};

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={baseStyles}
      className={`perudo-button ${className}`}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.target.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.filter = 'none';
          e.target.style.transform = 'none';
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;