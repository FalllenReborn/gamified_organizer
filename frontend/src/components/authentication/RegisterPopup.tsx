import React, { useContext, useState, useRef, FormEvent } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';
import styles from './registerPopup.module.css';

interface RegisterPopupProps {
  show: boolean;
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

const RegisterPopup: React.FC<RegisterPopupProps> = ({ show, isOpen, onClose, onOpenLogin }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const { t } = useTranslation();
  const { login } = useAuth();
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleRegister = async (e: FormEvent) => {
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
        const loginResponse = await axios.post('http://127.0.0.1:8000/accounts/login/', {
          username,
          password,
        });
        login();
        navigate(response.data.redirect);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage(error.response.data.error);
      } else {
        setMessage('An unexpected error occurred');
      }
    }
  };

  if (!show) {
    return null;
  }

  if (!isOpen) return null;

  const stopPropagation = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={`${styles.popupOverlay} ${isDarkMode ? styles.darkMode : ''}`} onWheel={stopPropagation}>
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
