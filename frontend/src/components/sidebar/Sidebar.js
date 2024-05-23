import React from 'react';
import './sidebar.css';

const Sidebar = ({ onReturnHome }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-buttons">
        <button className="sidebar-button">Create new list</button>
        <button className="sidebar-button">Create new shop</button>
        <button className="sidebar-button">Create new XP bar</button>
      </div>
      <div className="sidebar-bottom-buttons">
        <button className="sidebar-button">Login</button>
        <button className="sidebar-button">Register</button>
        <button className="sidebar-button" onClick={onReturnHome}>Return to Home page</button>
      </div>
    </div>
  );
};

export default Sidebar;