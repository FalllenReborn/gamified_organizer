import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getSettings, saveSettings } from '../utils/localStorageUtils';

interface ThemeContextProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  toggleLightMode: () => void;
  selectedLanguage: string;
  handleLanguageChange: (language: string) => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  toggleLightMode: () => {},
  selectedLanguage: '',
  handleLanguageChange: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getSettings().isDarkMode);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(getSettings().selectedLanguage);

  useEffect(() => {
    saveSettings({ isDarkMode, selectedLanguage });
  }, [isDarkMode, selectedLanguage]);

  const toggleDarkMode = () => {
    setIsDarkMode(true);
  };

  const toggleLightMode = () => {
    setIsDarkMode(false);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, toggleLightMode, selectedLanguage, handleLanguageChange }}>
      {children}
    </ThemeContext.Provider>
  );
};