import React, { useState } from 'react';
import './home.css';
import Dashboard from '../dashboard/Dashboard';

const Home = () => {
  const [isGuest, setIsGuest] = useState(false);

  const handleGuestClick = () => {
    setIsGuest(true);
  };

  const handleReturnHome = () => {
    setIsGuest(false);
  };

  if (isGuest) {
    return <Dashboard onReturnHome={handleReturnHome} />;
  }

  return (
    <div className="home-container">
      <button className="home-button" onClick={() => {}}>Login</button>
      <button className="home-button" onClick={() => {}}>Register</button>
      <button className="home-button" onClick={handleGuestClick}>Guest</button>
    </div>
  );
};

export default Home;