import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/home/Home';
import Dashboard from './components/dashboard/Dashboard';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ClockProvider } from './context/ClockContext';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ClockProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </ClockProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>

  );
}

export default App;
