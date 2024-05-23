import React, { useState, useContext } from 'react';
import './home.css';
import Dashboard from '../dashboard/Dashboard';
import { ThemeContext } from '../../ThemeContext';
import LoginPopup from '../login/LoginPopup';
import RegisterPopup from '../register/RegisterPopup';

const Home = () => {
  const { isDarkMode, toggleDarkMode, selectedLanguage, handleLanguageChange } = useContext(ThemeContext);
  const [isGuest, setIsGuest] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);

  const handleGuestClick = () => {
    setIsGuest(true);
  };

  const handleReturnHome = () => {
    setIsGuest(false);
  };

  const translations = {
    english: {
      login: 'Login',
      register: 'Register',
      guest: 'Guest'
    },
    polish: {
      login: 'Zaloguj się',
      register: 'Zarejestruj się',
      guest: 'Gość'
    }
  };

  const t = translations[selectedLanguage];

  const handleLoginClick = () => {
    setShowRegisterPopup(false); // Close the register popup
    setShowLoginPopup(true); // Open the login popup
  };

  const handleRegisterClick = () => {
    setShowLoginPopup(false); // Close the login popup
    setShowRegisterPopup(true); // Open the register popup
  };

  const handleClosePopups = () => {
    setShowLoginPopup(false);
    setShowRegisterPopup(false);
  };

  if (isGuest) {
    return <Dashboard onReturnHome={handleReturnHome} />;
  }

  return (
    <div className={`home-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="top-left">
        <label className="switch">
          <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
          <span className="slider round"></span>
        </label>
      </div>
      <div className="top-right">
        <select className="language-dropdown" value={selectedLanguage} onChange={(e) => handleLanguageChange(e.target.value)}>
          <option value="english">🇺🇸 English</option>
          <option value="polish">🇵🇱 Polish</option>
        </select>
      </div>
      <div className="home-buttons">
        <button className="home-button" onClick={handleLoginClick}>{t.login}</button>
        <button className="home-button" onClick={handleRegisterClick}>{t.register}</button>
        <button className="home-button" onClick={handleGuestClick}>{t.guest}</button>
      </div>
      <LoginPopup show={showLoginPopup} onClose={handleClosePopups} onOpenRegister={handleRegisterClick} />
      <RegisterPopup show={showRegisterPopup} onClose={handleClosePopups} onOpenLogin={handleLoginClick} />
    </div>
  );
};

export default Home;
