import React from 'react';
import './loginPopup.css';

const LoginPopup = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
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
            <button type="button" className="close-button" onClick={onClose}>Close</button>
            <button type="button" className="register-button">Register</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPopup;