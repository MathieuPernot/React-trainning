import React from "react";
import PropTypes from 'prop-types';

const Popup = ({ show, onClose, children }) => {
  if (!show) return null;

  return (
    <div className="popup-backdrop">
      <div className="popup">
        <button className="close-btn" onClick={onClose}>X</button>
        {children}
      </div>
    </div>
  );
};

Popup.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

export default Popup;