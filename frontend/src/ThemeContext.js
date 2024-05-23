import React, { createContext, useState, useEffect } from 'react';
import { getSettings, saveSettings } from './utils/localStorageUtils';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(getSettings().isDarkMode);
  const [selectedLanguage, setSelectedLanguage] = useState(getSettings().selectedLanguage);

  useEffect(() => {
    saveSettings({ isDarkMode, selectedLanguage });
  }, [isDarkMode, selectedLanguage]);

  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, selectedLanguage, handleLanguageChange }}>
      {children}
    </ThemeContext.Provider>
  );
};
