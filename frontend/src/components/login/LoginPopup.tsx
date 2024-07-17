import React, { useContext, useState, useRef, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import styles from './loginPopup.module.css';

interface LoginPopupProps {
  show: boolean;
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
}

const LoginPopup: React.FC<LoginPopupProps> = ({ show, isOpen, onClose, onOpenRegister }) => {
  const { isDarkMode, selectedLanguage } = useContext(ThemeContext);
  const { isAuthenticated, login } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Authentication handler
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/accounts/login/', {
        username,
        password,
      });
      setMessage(response.data.message);
      if (response.data.redirect) {
        login();
        onClose();
        navigate(response.data.redirect);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage(error.response.data.error);
      } else {
        setMessage('An unexpected error occurred.');
      }
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

  const isLanguageKey = (key: string): key is keyof typeof translations => {
    return key in translations;
  };
  
  const t = isLanguageKey(selectedLanguage) ? translations[selectedLanguage] : translations['english'];

  if (!show || !isOpen) {
    return null;
  }

  const stopPropagation = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={`${styles.popupOverlay} ${isDarkMode ? styles.darkMode : ''}`} onWheel={stopPropagation}>
      <div className={`${styles.popup} ${isDarkMode ? styles.darkMode : ''}`}>
        <button type="button" className={`btn-close ${styles.closeIcon}`} aria-label="Close" onClick={onClose}></button>
        <h2>{t.login}</h2>
        <form className={styles.loginForm} onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">{t.username}</label>
            <input
              type="text"
              className="form-control"
              id="username"
              ref={inputRef}
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className={styles.popupButtons}>
            <button type="button" className={`btn btn-link ${styles.registerButton}`} onClick={onOpenRegister}>{t.register}</button>
            <button type="submit" className={`btn btn-primary ${styles.confirmButton}`}>{t.confirm}</button>
          </div>
        </form>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default LoginPopup;
