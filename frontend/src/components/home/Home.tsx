import React, { useState, useContext, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';
import LoginPopup from '../authentication/LoginPopup';
import RegisterPopup from '../authentication/RegisterPopup';
import styles from './home.module.css';
import classNames from 'classnames';

type Language = 'english' | 'polish';

const Home: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const { isAuthenticated, logout } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const { t, setLanguage, language } = useTranslation();
  const navigate = useNavigate();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as Language);
  };

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
          <select
            className={styles.languageDropdown}
            value={language} 
            onChange={handleLanguageChange}
          >
          <option value="english">{t.english}</option>
          <option value="polish">{t.polish}</option>
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
