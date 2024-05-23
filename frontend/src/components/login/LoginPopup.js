import React, { useContext } from 'react';
import { ThemeContext } from '../../ThemeContext';
import './loginPopup.css';

const LoginPopup = ({ show, onClose }) => {
  const { isDarkMode } = useContext(ThemeContext);

  if (!show) {
    return null;
  }

  return (
    <div className={`popup-overlay ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className={`popup-content ${isDarkMode ? 'dark-mode' : ''}`}>
        <button className="close-icon" onClick={onClose}>X</button>
        <h2>Login</h2>
        <form className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input type="text" id="username" name="username" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" required />
          </div>
          <div className="form-actions">
            <button type="button" className="register-button">Register</button>
            <button type="button" className="confirm-button">Confirm</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPopup;