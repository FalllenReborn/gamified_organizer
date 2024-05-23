import React, { useContext, useState } from 'react';
import { ThemeContext } from '../../ThemeContext';
import './registerPopup.css';

const RegisterPopup = ({ show, onClose, onOpenLogin }) => {
  const { isDarkMode, selectedLanguage } = useContext(ThemeContext);

  if (!show) {
    return null;
  }

  const translations = {
    english: {
      login: 'Login',
      confirm: 'Confirm',
      register: 'Register',
      username: 'Username',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password'
    },
    polish: {
      login: 'Zaloguj się',
      confirm: 'Potwierdź',
      register: 'Zarejestruj się',
      username: 'Nazwa użytkownika',
      email: 'Email',
      password: 'Hasło',
      confirmPassword: 'Potwierdź hasło'
    }
  };

  const t = translations[selectedLanguage];

  return (
    <div className={`popup-overlay ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className={`popup-content ${isDarkMode ? 'dark-mode' : ''}`}>
        <button className="close-icon" onClick={onClose}>X</button>
        <h2>{t.register}</h2>
        <form className="login-form">
            <div className="form-group">
              <label htmlFor="email">{t.email}</label>
              <input type="email" id="email" name="email" required />
            </div>
          <div className="form-group">
            <label htmlFor="username">{t.username}</label>
            <input type="text" id="username" name="username" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t.password}</label>
            <input type="password" id="password" name="password" required />
          </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">{t.confirmPassword}</label>
              <input type="password" id="confirmPassword" name="confirmPassword" required />
            </div>
          <div className="form-actions">
            <button type="button" className="toggle-mode-button" onClick={onOpenLogin}>{t.login}</button>
            <button type="button" className="confirm-button">{t.confirm}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPopup;