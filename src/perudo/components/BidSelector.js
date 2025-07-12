import React, { useState } from 'react';
import Dice from './Dice';
import Button from './Button';

const BidSelector = ({ lastBid, totalDice, onValidate, onCancel }) => {
  const [bidValue, setBidValue] = useState(2);
  const [bidCount, setBidCount] = useState(1);
  const [bidError, setBidError] = useState('');

  // Validation de l'enchère avant de l'envoyer
  const validateAndPlaceBid = () => {
    const currentBid = { diceValue: bidValue, diceCount: bidCount };
    if (lastBid && (bidCount < 1 || bidValue < 1 || bidValue > 6)) {
      setBidError('Enchère invalide.');
      return;
    }
    setBidError('');
    onValidate(bidValue, bidCount);
  };

  return (
    <div className="perudo-section perudo-bidselector-modal">
      <h3 className="perudo-label" style={{textAlign: 'center'}}>Nouvelle enchère</h3>
      <div className="perudo-bidselector-fields">
        <div className="perudo-bidselector-field">
          <label className="perudo-bidselector-label">Valeur du dé</label>
          <div className="perudo-bidselector-dice-row">
            <Button type="button" onClick={() => setBidValue(Math.max(1, bidValue - 1))} style={{width: '1.6rem', height: '1.6rem', padding: 0}}>-</Button>
            <Dice number={bidValue} />
            <Button type="button" onClick={() => setBidValue(Math.min(6, bidValue + 1))} style={{width: '1.6rem', height: '1.6rem', padding: 0}}>+</Button>
          </div>
        </div>
        <div className="perudo-bidselector-field">
          <label className="perudo-bidselector-label">number of dice</label>
          <div className="perudo-bidselector-dice-row">
            <Button type="button" onClick={() => setBidCount(Math.max(1, bidCount - 1))} style={{width: '1.6rem', height: '1.6rem', padding: 0}}>-</Button>
            <span style={{fontSize: '1.5rem', minWidth: '2.5rem', textAlign: 'center'}}>{bidCount}</span>
            <Button type="button" onClick={() => setBidCount(Math.min(totalDice, bidCount + 1))} style={{width: '1.6rem', height: '1.6rem', padding: 0}}>+</Button>
          </div>
        </div>
      </div>
      {bidError && <div className="perudo-bidselector-error">{bidError}</div>}
      <div className="perudo-bidselector-actions">
        <Button onClick={validateAndPlaceBid}>Valider</Button>
        <Button onClick={onCancel} style={{background: 'var(--perudo-light-grey)'}}>Annuler</Button>
      </div>
    </div>
  );
};

export default BidSelector; 