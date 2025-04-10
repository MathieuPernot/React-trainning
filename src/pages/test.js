import React from 'react';

const TestPage = () => {
  return (
    <div className="profile-container">
      {/* En-tête de la page */}
      <header className="profile-header">
        <h1>Bienvenue sur le Profil de Xx_TomBartix_xX</h1>
        <p className="profile-tagline">"Je suis le plus cool des cools"</p>
      </header>

      {/* Section photo de profil et informations */}
      <section className="profile-info">
        <div className="profile-image">
          <img src="/MicrosoftTeams-image.png" alt="photo de profil" />
        </div>
        <div className="profile-details">
          <h2>Tom Tom Tom Sahur</h2>
          <p>Age: 22 ans</p>
          <p>Passionné des states, charismatic et biensur fasion victim</p>
          <div className="social-links">
            <a href="#" target="_blank">Twitter</a>
            <a href="#" target="_blank">Instagram</a>
            <a href="#" target="_blank">Snapchat</a>
          </div>
        </div>
      </section>

      {/* Section des articles récents */}
      <section className="recent-articles">
        <h3>Mes derniers articles :</h3>
        <div className="article-preview">
          <h4>Mon aventure à Paris !</h4>
          <p>Je vous raconte mon dernier voyage à Paris, c'était incroyable !</p>
          <a href="#">Lire plus...</a>
        </div>
        <div className="article-preview">
          <h4>Ma playlist du mois</h4>
          <p>Voici mes morceaux préférés de ce mois-ci, à découvrir absolument !</p>
          <a href="#">Lire plus...</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="profile-footer">
        <p>&copy; 2025 Tom Tom Tom Sahur | Skybloug</p>
      </footer>
    </div>
  );
};

export default TestPage;

//      <img src="/MicrosoftTeams-image.png" alt="My Image" />
