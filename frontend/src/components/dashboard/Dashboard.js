import React from 'react';
import Sidebar from '../sidebar/Sidebar';

const Dashboard = ({ onReturnHome }) => {
  return (
    <div className="dashboard">
      <Sidebar onReturnHome={onReturnHome} />
      <div className="dashboard-content">
        <h1>Dashboard</h1>
        {/* Other dashboard content will go here */}
      </div>
    </div>
  );
};

export default Dashboard;