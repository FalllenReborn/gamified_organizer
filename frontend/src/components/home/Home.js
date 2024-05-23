import React, { useState } from 'react';
import './home.css';
import Dashboard from '../dashboard/Dashboard';

const Home = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [isGuest, setIsGuest] = useState(false);

  const handleModeChange = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  const handleGuestClick = () => {
    setIsGuest(true);
  };

  const handleReturnHome = () => {
    setIsGuest(false);
  };

  if (isGuest) {
    return <Dashboard onReturnHome={handleReturnHome} />;
  }

  return (
    <div className={`home-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="top-left">
        <label className="switch">
          <input type="checkbox" onChange={handleModeChange} />
          <span className="slider round"></span>
        </label>
      </div>
      <div className="top-right">
        <select className="language-dropdown" value={selectedLanguage} onChange={handleLanguageChange}>
          <option value="english">🇺🇸 English</option>
          <option value="polish">🇵🇱 Polish</option>
        </select>
      </div>
      <div className="home-buttons">
        <button className="home-button" onClick={() => {}}>Login</button>
        <button className="home-button" onClick={() => {}}>Register</button>
        <button className="home-button" onClick={handleGuestClick}>Guest</button>
      </div>
    </div>
  );
};

export default Home;
