import React, { useEffect, useState } from 'react';
import '../styles/App.css';
import '../styles/test.css';
import '../styles/globals.css';
import '../styles/foodtruck.css';
import '../styles/gaben.css';
import '../styles/samule.css';
import '../perudo/perudo.css';
import '../styles/leak.css';
import '../styles/font.css';

import { Analytics } from "@vercel/analytics/react"
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Home from './index';
import About from './test';
import Foodtruck from './foodtruck';
import Gaben from './gaben';
import Samule from './samule';
import Perudo from '../perudo/NewHome';
import Leak from './leak';
import One from './indice/1';
import Two from './indice/2';
import Three from './indice/3';
import Four from './indice/4';

function MyApp() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/test" element={<About />} />
          <Route path="/foodtrucks" element={<Foodtruck />} />
          <Route path="/gaben" element={<Gaben />} />
          <Route path="/samule" element={<Samule />} />
          <Route path="/perudo" element={<Perudo />} />
          <Route path="/leak" element={<Leak />} />
          <Route path="/indice/1" element={<One />} />
          <Route path="/indice/2" element={<Two />} />
          <Route path="/indice/3" element={<Three />} />
          <Route path="/indice/4" element={<Four />} />

        </Routes>
      </Router>
      <Analytics />
    </>
  );
}

export default MyApp;