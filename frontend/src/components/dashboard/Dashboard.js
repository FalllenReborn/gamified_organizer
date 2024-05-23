import React, { useContext } from 'react';
import { ThemeContext } from '../../ThemeContext';
import Sidebar from '../sidebar/Sidebar';
import './dashboard.css';


const Dashboard = ({ onReturnHome }) => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <div className={`dashboard-container ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <Sidebar onReturnHome={onReturnHome} />
      <div className="dashboard-content">
        <h1></h1>
        {/* Other dashboard content will go here */}
      </div>
    </div>
  );
};

export default Dashboard;