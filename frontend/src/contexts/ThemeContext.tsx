import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getThemeSettings, saveThemeSettings } from '../utils/localStorageUtils';

interface ThemeContextProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  toggleLightMode: () => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  toggleLightMode: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getThemeSettings().isDarkMode);

  useEffect(() => {
    saveThemeSettings({ isDarkMode });
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(true);
  };

  const toggleLightMode = () => {
    setIsDarkMode(false);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, toggleLightMode }}>
      {children}
    </ThemeContext.Provider>
  );
};