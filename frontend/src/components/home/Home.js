import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../ThemeContext';
import { useAuth } from '../../AuthContext';
import LoginPopup from '../login/LoginPopup';
import RegisterPopup from '../register/RegisterPopup';
import styles from './home.module.css';
import classNames from 'classnames';

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
    <div className={`${styles.container} ${isDarkMode ? styles.darkMode : styles.lightMode}`}>
      <div className={styles.homeContainer}>
        <div className={styles.topLeft}>
          <label className={styles.switch}>
            <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
            <span className={classNames(styles.slider, styles.round)}></span>
          </label>
          <select className={styles.languageDropdown} value={selectedLanguage} onChange={(e) => handleLanguageChange(e.target.value)}>
            <option value="english">🇺🇸 English</option>
            <option value="polish">🇵🇱 Polish</option>
          </select>
        </div>
        {isAuthenticated ? (
          <div className={styles.homeButtons}>
            <button className={styles.homeButton} onClick={handleDashboardGuest}>{t.dashboard}</button>
            <button className={styles.homeButton} onClick={handleLogout}>{t.logout}</button>
          </div>
        ) : (
          <div className={styles.homeButtons}>
            <button className={styles.homeButton} onClick={handleLoginClick}>{t.login}</button>
            <button className={styles.homeButton} onClick={handleRegisterClick}>{t.register}</button>
            <button className={styles.homeButton} onClick={handleDashboardGuest}>{t.guest}</button>
          </div>
        )}
        {showLoginPopup && <LoginPopup show={true} isOpen={true} onClose={handleClosePopups} onOpenRegister={handleRegisterClick} />}
        {showRegisterPopup && <RegisterPopup show={true} isOpen={true} onClose={handleClosePopups} onOpenLogin={handleLoginClick} />}
      </div>
    </div>
  );
};

export default Home;
