import React, { createContext, useContext, useState, useEffect, FC } from 'react';

interface AuthContextProps {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const initialAuthContext: AuthContextProps = {
  isAuthenticated: false,
  login: () => {},
  logout: () => {}
};

const AuthContext = createContext<AuthContextProps>(initialAuthContext);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated (e.g., by checking the authentication token in local storage)
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  const login = () => {
    // Perform login actions (e.g., set authentication token in local storage)
    localStorage.setItem('authToken', 'yourAuthToken');
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Perform logout actions (e.g., remove authentication token from local storage)
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};