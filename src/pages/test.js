import React, { useState } from "react";
import Popup from './Popup';
import { Link } from 'react-router-dom';


const TestPage = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [showPopup2, setShowPopup2] = useState(false);

  return (
    <div className="profile-container">
      <header className="profile-header">
        <div className="container2">
          <div className="item-left"><div className="button-container">
                <Link to="/">
                  <button className='boutton'>Retour</button>
                </Link>
              </div>
            </div>
            <div className="item-center">
              <h1>Bienvenue sur le Profil de Xx_TomBartix_xX</h1>
            <p className="profile-tagline">"Je suis le plus cool des cools"</p>
            </div>
          </div>
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
          <h4>Ma dernière aventure !</h4>
          <p>Je vous raconte mon dernier vlog, c'était incroyable !</p> 
          <button
              className="popupbouton"
              onClick={() => window.open("https://www.youtube.com/watch?v=J0gss-Zavmo", "_blank")}
            >
              Lire plus...
            </button>         
        </div>
        <div className="article-preview">
          <h4>Ma playlist du mois</h4>
          <p>Voici mes morceaux préférés de ce mois-ci, à découvrir absolument !</p>
          <button className = 'popupbouton' onClick={() => setShowPopup(true)}>Lire plus...</button>

          <Popup show={showPopup} onClose={() => setShowPopup(false)}>
            <div className="secondpopup">
              <h2>🎵 Liste de musiques</h2>

              <ul className="music-list">
                {[
                  {
                    id: 1,
                    title: "Aqua - Barbie Girl",
                    cover: "https://m.media-amazon.com/images/M/MV5BOWNkMTkyYWItZmNlMS00MTMxLTliNzYtYjRlMjNjZjQ2MzRhXkEyXkFqcGdeQXVyMTI1Mzg0ODA5._V1_FMjpg_UX1000_.jpg",
                    url: "https://www.youtube.com/watch?time_continue=1&v=ZyhrYis509A&embeds_referring_euri=https%3A%2F%2Fwww.bing.com%2F&embeds_referring_origin=https%3A%2F%2Fwww.bing.com&source_ve_path=Mjg2NjIsMzY4NDIsMjg2NjY"
                  },
                  {
                    id: 2,
                    title: "O-Zone - Dragostea Din Teï",
                    cover: "https://img.cdandlp.com/2014/11/imgL/117269774.jpg",
                    url: "https://www.youtube.com/watch?v=56TKq_qIb40"
                  },
                  {
                    id: 3,
                    title: "Ziak - Fixette",
                    cover: "https://th.bing.com/th/id/OIP.bFpgO4hJ3iStXCNX5lqo9wHaEK?rs=1&pid=ImgDetMain",
                    url: "https://www.youtube.com/watch?v=xk1c02v3U_U"
                  }
                ].map((music) => (
                  <li key={music.id} className="music-item">
                    <a href={music.url} target="_blank" rel="noopener noreferrer">
                      <img src={music.cover} alt={music.title} className="music-cover" />
                      <span className="music-title">{music.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
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

