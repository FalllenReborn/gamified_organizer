import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/home/Home';
import Dashboard from './components/dashboard/Dashboard';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ClockProvider } from './context/ClockContext';


function App() {
  const [createNewList, setCreateNewList] = useState(false);

  const handleCreateNewList = () => {
    setCreateNewList(true); // Set createNewList state to true
    setTimeout(() => {
      setCreateNewList(false); // Set createNewList state back to false after a short delay
    }, 100);
  };

  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ClockProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard createNewList={createNewList} onCreateNewList={handleCreateNewList} />} />
            </Routes>
          </ClockProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;