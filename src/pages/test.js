import React, { useState } from "react";
import Popup from './popup';

const TestPage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [showPopup2, setShowPopup2] = useState(false);

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>Bienvenue sur le Profil de Xx_TomBartix_xX</h1>
        <p className="profile-tagline">"Je suis le plus cool des cools"</p>
      </header>

      <section className="profile-info">
        <div className="profile-image">
          <img src="/MicrosoftTeams-image.png" alt="photo de profil" />
        </div>
        <div className="profile-details">
          <h2>Tom Tom Tom Sahur</h2>
          <p>Age: 22 ans</p>
          <p>Passionné des states, charismatic et biensur fasion victim</p>
        </div>
      </section>

      <section className="recent-articles">
        <h3>Mes derniers articles :</h3>
        <div className="article-preview">
          <h4>Mon aventure à Paris !</h4>
          <p>Je vous raconte mon dernier voyage à Paris, c'était incroyable !</p> 
            <button className = 'popupbouton' onClick={() => setShowPopup(true)}>Lire plus...</button>
          <Popup show={showPopup} onClose={() => setShowPopup(false)}>
            <div className="firstpopup">
                <h2>test1</h2>
                <p>Ceci est une pop-up React</p>
            </div>
          </Popup>
        </div>
        <div className="article-preview">
          <h4>Ma playlist du mois</h4>
          <p>Voici mes morceaux préférés de ce mois-ci, à découvrir absolument !</p>
          <button className = 'popup' onClick={() => setShowPopup2(true)}>Lire plus...</button>

          <Popup show={showPopup2} onClose={() => setShowPopup2(false)}>
          <div className="secondpopup">
                <h2>test2</h2>
                <p>Ceci est une pop-up React</p>
            </div>
          </Popup>
          
        </div>
      </section>

      <footer className="profile-footer">
        <p>&copy; 2025 Tom Tom Tom Sahur | Skybloug</p>
      </footer>
    </div>
  );
};

export default TestPage;

