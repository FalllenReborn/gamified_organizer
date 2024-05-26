import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../ThemeContext';
import { useAuth } from '../../AuthContext';
import LoginPopup from '../login/LoginPopup';
import RegisterPopup from '../register/RegisterPopup';
import './home.css';

const Home = () => {
  const { isDarkMode, toggleDarkMode, selectedLanguage, handleLanguageChange } = useContext(ThemeContext);
  const { isAuthenticated, logout } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const navigate = useNavigate();

  const translations = {
    english: {
      login: 'Login',
      register: 'Register',
      guest: 'Guest',
      logout: 'Logout',
      dashboard: 'Dashboard'
    },
    polish: {
      login: 'Zaloguj się',
      register: 'Zarejestruj się',
      guest: 'Gość',
      logout: 'Wyloguj się',
      dashboard: 'Tablica'
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

  const handleDashboardGuest = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
  };

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
      {isAuthenticated ? (
        <div className="home-buttons">
          <button className="home-button" onClick={handleDashboardGuest}>{t.dashboard}</button>
          <button className="home-button" onClick={handleLogout}>{t.logout}</button>
        </div>
      ) : (
        <div className="home-buttons">
          <button className="home-button" onClick={handleLoginClick}>{t.login}</button>
          <button className="home-button" onClick={handleRegisterClick}>{t.register}</button>
          <button className="home-button" onClick={handleDashboardGuest}>{t.guest}</button>
        </div>
      )}
      {showLoginPopup && <LoginPopup show={true} isOpen={true} onClose={handleClosePopups} onOpenRegister={handleRegisterClick} />}
      {showRegisterPopup && <RegisterPopup show={true} isOpen={true} onClose={handleClosePopups} onOpenLogin={handleLoginClick} />}
    </div>
  );
};

export default Home;
