import React, { useContext, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../ThemeContext';
import './registerPopup.css';

const RegisterPopup = ({ show, onClose, onOpenLogin }) => {
  const { isDarkMode, selectedLanguage } = useContext(ThemeContext);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/accounts/register/', {
        username,
        email,
        password,
        confirm_password: confirmPassword,
      });
      setMessage(response.data.message);
      if (response.data.redirect) {
        navigate(response.data.redirect);
      }
    } catch (error) {
      setMessage(error.response.data.error);
    }
  };

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
        <form className="login-form" onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="email">{t.email}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
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
          <div className="form-group">
            <label htmlFor="confirmPassword">{t.confirmPassword}</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="button" className="toggle-mode-button" onClick={onOpenLogin}>{t.login}</button>
            <button type="submit" className="confirm-button">{t.confirm}</button>
          </div>
        </form>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default RegisterPopup;