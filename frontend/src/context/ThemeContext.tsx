import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { getSettings, saveSettings } from '../utils/localStorageUtils';

interface ThemeContextProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  selectedLanguage: string;
  handleLanguageChange: (language: string) => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  isDarkMode: false,
  toggleDarkMode: () => {},
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
    setIsDarkMode(prevMode => !prevMode);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, selectedLanguage, handleLanguageChange }}>
      {children}
    </ThemeContext.Provider>
  );
};
