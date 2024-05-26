import React, { useContext } from 'react';
import { ThemeContext } from '../../ThemeContext';
import Sidebar from '../sidebar/Sidebar';
import styles from './dashboard.module.css';


const Dashboard = ({ onReturnHome }) => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <div className={`${styles.dashboardContainer} ${isDarkMode ? styles.darkMode : styles.lightMode}`}>
      <Sidebar onReturnHome={onReturnHome} />
      <div className={styles.dashboardContent}>
        <h1></h1>
        {/* Other dashboard content will go here */}
      </div>
    </div>
  );
};

export default Dashboard;