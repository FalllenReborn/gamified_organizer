import React, { useContext, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../ThemeContext';
import { useAuth } from '../../AuthContext';
import styles from './registerPopup.module.css';

const RegisterPopup = ({ show, isOpen ,onClose, onOpenLogin }) => {
  const { isDarkMode, selectedLanguage } = useContext(ThemeContext);
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Authentication handler

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
        // Automatically log in the user after registration
        const loginResponse = await axios.post('http://127.0.0.1:8000/accounts/login/', {
          username,
          password,
        });
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

  if (!show) {
    return null;
  }

  if (!isOpen) return null;

  return (
    <div className={`${styles.popupOverlay} ${isDarkMode ? styles.darkMode : ''}`}>
      <div className={`${styles.popup} ${isDarkMode ? styles.darkMode : ''}`}>
        <button type="button" className={`btn-close ${styles.closeIcon}`} aria-label="Close" onClick={onClose}></button>
        <h2>{t.register}</h2>
        <form className={styles.loginForm} onSubmit={handleRegister}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">{t.email}</label>
            <input
              type="email"
              className="form-control"
              id="email"
              ref={inputRef}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="username" className="form-label">{t.username}</label>
            <input
              type="text"
              className="form-control"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="password" className="form-label">{t.password}</label>
            <input
              type="password"
              className="form-control"
              id="password"
              ref={inputRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className="form-label">{t.confirmPassword}</label>
            <input
              type="password"
              className="form-control"
              id="confirmPassword"
              ref={inputRef}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <div className={styles.popupButtons}>
            <button type="button" className="btn btn-link" onClick={onOpenLogin}>{t.login}</button>
            <button type="submit" className="btn btn-primary">{t.confirm}</button>
          </div>
        </form>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default RegisterPopup;