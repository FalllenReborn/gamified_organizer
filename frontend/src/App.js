import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/home/Home';
import TestLogin from './components/testAuth/TestLogin';
import TestRegister from './components/testAuth/TestRegister';
import Dashboard from './components/dashboard/Dashboard';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/test-login" element={<TestLogin />} />
            <Route path="/test-register" element={<TestRegister />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>

  );
}

export default App;
