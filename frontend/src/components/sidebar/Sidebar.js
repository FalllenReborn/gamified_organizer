import React, { useContext, useState } from 'react';
import { ThemeContext } from '../../ThemeContext';
import LoginPopup from '../login/LoginPopup';
import './sidebar.css';

const Sidebar = ({ onReturnHome }) => {
    const { isDarkMode, toggleDarkMode, selectedLanguage, handleLanguageChange } = useContext(ThemeContext);
    const [showLoginPopup, setShowLoginPopup] = useState(false);

    const translations = {
        english: {
          createList: 'Create new list',
          createShop: 'Create new shop',
          createXP: 'Create new XP bar',
          login: 'Login',
          register: 'Register',
          returnHome: 'Return to Home page'
        },
        polish: {
          createList: 'Stwórz nową listę',
          createShop: 'Stwórz nowy sklep',
          createXP: 'Stwórz nowy licznik doświadczenia',
          login: 'Zaloguj się',
          register: 'Zarejestruj się',
          returnHome: 'Wróć do strony głównej'
        }
      };
    
    const t = translations[selectedLanguage];

    const handleLoginClick = () => {
        setShowLoginPopup(true);
      };
    
      const handleClosePopup = () => {
        setShowLoginPopup(false);
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
        <button className="sidebar-button" onClick={handleLoginClick}>{t.login}</button>
        <button className="sidebar-button">{t.register}</button>
        <button className="sidebar-button" onClick={onReturnHome}>{t.returnHome}</button>
      </div>
      <LoginPopup show={showLoginPopup} onClose={handleClosePopup} />
    </div>
  );
};

export default Sidebar;
