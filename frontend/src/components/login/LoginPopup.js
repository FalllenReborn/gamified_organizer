import React, { useContext } from 'react';
import { ThemeContext } from '../../ThemeContext';
import './loginPopup.css';

const LoginPopup = ({ show, onClose }) => {
  const { isDarkMode, selectedLanguage } = useContext(ThemeContext);

  const translations = {
    english: {
      login: 'Login',
      confirm: 'Confirm',
      register: 'Register',
      username: 'Username',
      password: 'Password'
    },
    polish: {
      login: 'Zaloguj się',
      confirm: 'Potwierdź',
      register: 'Zarejestruj się',
      username: 'Nazwa użytkownika',
      password: 'Hasło'
    }
  };

  const t = translations[selectedLanguage];

  if (!show) {
    return null;
  }

  return (
    <div className={`popup-overlay ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className={`popup-content ${isDarkMode ? 'dark-mode' : ''}`}>
        <button className="close-icon" onClick={onClose}>X</button>
        <h2>{t.login}</h2>
        <form className="login-form">
          <div className="form-group">
            <label htmlFor="username">{t.username}</label>
            <input type="text" id="username" name="username" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t.password}</label>
            <input type="password" id="password" name="password" required />
          </div>
          <div className="form-actions">
            <button type="button" className="register-button">{t.register}</button>
            <button type="button" className="confirm-button">{t.confirm}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPopup;