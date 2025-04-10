import React from "react";

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

export default Popup;
//test