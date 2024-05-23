import React from 'react';
import './home.css';

const Home = () => {
  return (
    <div className="home-container">
      <button className="home-button">Login</button>
      <button className="home-button">Register</button>
      <button className="home-button">Guest</button>
    </div>
  );
};

export default Home;