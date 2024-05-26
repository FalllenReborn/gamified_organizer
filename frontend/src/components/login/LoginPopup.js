import React, { useContext, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../ThemeContext';
import { useAuth } from '../../AuthContext';
import './loginPopup.css';

const LoginPopup = ({ show, isOpen, onClose, onOpenRegister }) => {
  const { isDarkMode, selectedLanguage } = useContext(ThemeContext);
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Authentication handler

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/accounts/login/', {
        username,
        password,
      });
      setMessage(response.data.message);
      if (response.data.redirect) {
        login();
        navigate(response.data.redirect);
      }
    } catch (error) {
      setMessage(error.response.data.error);
    }
  };

  // Translations

  const translations = {
    english: {
      login: 'Login',
      confirm: 'Confirm',
      register: 'Register',
      username: 'Username',
      password: 'Password',
    },
    polish: {
      login: 'Zaloguj się',
      confirm: 'Potwierdź',
      register: 'Zarejestruj się',
      username: 'Nazwa użytkownika',
      password: 'Hasło',
    },
  };

  const t = translations[selectedLanguage];

  if (!show) {
    return null;
  }

  if (!isOpen) return null;

  return (
    <div className={`popup-overlay ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className={`popup ${isDarkMode ? 'dark-mode' : ''}`}>
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
        <h2>{t.login}</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">{t.username}</label>
            <input
              type="text"
              className="form-control"
              id="username"
              ref={inputRef}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">{t.password}</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="popup-buttons">
            <button type="button" className="btn btn-link" onClick={onOpenRegister}>{t.register}</button>
            <button type="submit" className="btn btn-primary">{t.confirm}</button>
          </div>
        </form>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default LoginPopup;
