import React, { useContext, useState } from 'react';
import { ThemeContext } from '../../ThemeContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './loginPopup.css';

const LoginPopup = ({ show, onClose, onOpenRegister }) => {
  const { isDarkMode, selectedLanguage } = useContext(ThemeContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/accounts/login/', {
        username,
        password,
      });
      setMessage(response.data.message);
      if (response.data.redirect) {
        navigate(response.data.redirect);
      }
    } catch (error) {
      setMessage(error.response.data.error);
    }
  };

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
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">{t.username}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">{t.password}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="register-button" onClick={onOpenRegister}>{t.register}</button>
            <button type="submit" className="confirm-button">{t.confirm}</button>
          </div>
        </form>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default LoginPopup;