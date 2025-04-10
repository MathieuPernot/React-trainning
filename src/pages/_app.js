import '../styles/App.css';
import '../styles/test.css';
import '../styles/globals.css';
import '../styles/Popup.css'; 

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';

import Home from './index';
import About from './test';


function MyApp() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); 
  }, []);

  if (!isClient) {
    return null; 
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/test" element={<About />} />
      </Routes>
    </Router>
  );
}

export default MyApp;
