import React, { createContext, useState } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('english');

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
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
