import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { ClockContext } from '../../context/ClockContext'; // Import ClockContext
import LoginPopup from '../login/LoginPopup';
import RegisterPopup from '../register/RegisterPopup';
import styles from './sidebar.module.css';
import classNames from 'classnames';

const Sidebar = ({ onCreateNewList }) => {
  const { isDarkMode, toggleDarkMode, selectedLanguage, handleLanguageChange } = useContext(ThemeContext);
  const { isAuthenticated, logout } = useAuth();
  const currentDateTime = useContext(ClockContext); // Use ClockContext
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const navigate = useNavigate();

  const translations = {
    english: {
      createList: 'Create new list',
      createShop: 'Create new shop',
      createXP: 'Create new XP bar',
      login: 'Login',
      register: 'Register',
      returnHome: 'Home page',
      logout: 'Logout',
      settings: 'Settings',
    },
    polish: {
      createList: 'Stwórz nową listę',
      createShop: 'Stwórz nowy sklep',
      createXP: 'Stwórz nowy licznik doświadczenia',
      login: 'Zaloguj się',
      register: 'Zarejestruj się',
      returnHome: 'Strona Główna',
      logout: 'Wyloguj się',
      settings: 'Ustawienia',
    },
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

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleLogout = () => {
    logout();
  };

  const handleDragStart = (e) => {
    e.preventDefault();
  };

  return (
    <div className={`${styles.sidebar} ${isDarkMode ? styles.darkMode : styles.lightMode}`} onDragStart={handleDragStart}>
      {/* {isVisible && <ToggleButton onClick={handleToggle} isVisible={isVisible} />} */}
      <div className={styles.sidebarTop}>
        <label className={styles.switch}>
          <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
          <span className={classNames(styles.slider, styles.round)}></span>
        </label>
        <select className={styles.languageDropdown} value={selectedLanguage} onChange={(e) => handleLanguageChange(e.target.value)}>
          <option value="english">🇺🇸 English</option>
          <option value="polish">🇵🇱 Polish</option>
        </select>
      </div>
      <div className={styles.dateTime}>
        {currentDateTime && <p>{currentDateTime}</p>}
      </div>
      <div className={styles.sidebarButtons}>
        <button className={styles.sidebarButton} onClick={onCreateNewList}>{t.createList}</button>
        <button className={styles.sidebarButton}>{t.createShop}</button>
        <button className={styles.sidebarButton}>{t.createXP}</button>
      </div>
      <div className={styles.sidebarBottomButtons}>
        <div className={styles.settingsButton}>
          <button className="btn btn-primary mt-2" >{t.settings}</button>
        </div>
        <div className={styles.returnHome}>
          <button className="btn btn-primary mt-2" onClick={handleReturnHome}>{t.returnHome}</button>
        </div>
        {isAuthenticated ? (
          <div className={styles.logoutButton}>
            <button className="btn btn-secondary mt-2" onClick={handleLogout}>{t.logout}</button>
          </div>
        ) : (
          <div className={styles.authButtons}>
            <button className="btn btn-secondary mt-2 mr-2" onClick={handleLoginClick}>{t.login}</button>
            <button className="btn btn-secondary mt-2" onClick={handleRegisterClick}>{t.register}</button>
          </div>
        )}
      </div>
      {showLoginPopup && <LoginPopup show={true} isOpen={true} onClose={handleClosePopups} onOpenRegister={handleRegisterClick} />}
      {showRegisterPopup && <RegisterPopup show={true} isOpen={true} onClose={handleClosePopups} onOpenLogin={handleLoginClick} />}
    </div>
  );
};

export default Sidebar;
