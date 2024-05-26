import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../ThemeContext';
import { useAuth } from '../../AuthContext';
import LoginPopup from '../login/LoginPopup';
import RegisterPopup from '../register/RegisterPopup';
import './sidebar.css';

const Sidebar = () => {
    const { isDarkMode, toggleDarkMode, selectedLanguage, handleLanguageChange } = useContext(ThemeContext);
    const { isAuthenticated, logout } = useAuth();
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
          logout: 'Logout'
        },
        polish: {
          createList: 'Stwórz nową listę',
          createShop: 'Stwórz nowy sklep',
          createXP: 'Stwórz nowy licznik doświadczenia',
          login: 'Zaloguj się',
          register: 'Zarejestruj się',
          returnHome: 'Strona Główna',
          logout: 'Wyloguj się'
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

      const handleReturnHome = () => {
        navigate('/');
      };

      const handleLogout = () => {
        logout();
      };

  return (
    <div className={`sidebar ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="sidebar-top">
        <label className="switch">
          <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
          <span className="slider round"></span>
        </label>
        <select className="language-dropdown" value={selectedLanguage} onChange={(e) => handleLanguageChange(e.target.value)}>
          <option value="english">🇺🇸 English</option>
          <option value="polish">🇵🇱 Polish</option>
        </select>
      </div>
      <div className="sidebar-buttons">
        <button className="sidebar-button">{t.createList}</button>
        <button className="sidebar-button">{t.createShop}</button>
        <button className="sidebar-button">{t.createXP}</button>
      </div>
      <div className="sidebar-bottom-buttons">
        {isAuthenticated ? (
          <>
            <div className="return-home">
              <button className="btn btn-primary" onClick={handleReturnHome}>{t.returnHome}</button>
            </div>
            <button className="btn btn-secondary mt-2" onClick={handleLogout}>{t.logout}</button>
          </>
        ) : (
          <>
            <div className="return-home">
              <button className="btn btn-primary" onClick={handleReturnHome}>{t.returnHome}</button>
            </div>
            <div className="auth-buttons">
              <button className="btn btn-link" onClick={handleLoginClick}>{t.login}</button>
              <button className="btn btn-link" onClick={handleRegisterClick}>{t.register}</button>
            </div>
          </>
        )}
      </div>
      {showLoginPopup && <LoginPopup show={true} isOpen={true} onClose={handleClosePopups} onOpenRegister={handleRegisterClick} />}
      {showRegisterPopup && <RegisterPopup show={true} isOpen={true} onClose={handleClosePopups} onOpenLogin={handleLoginClick} />}
    </div>
  );
};

export default Sidebar;
