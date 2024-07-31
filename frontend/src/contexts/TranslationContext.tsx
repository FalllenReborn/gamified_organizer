import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getLanguageSettings, saveLanguageSettings } from '../utils/localStorageUtils';
import { translations } from '../translations';

type Language = 'english' | 'polish';

type TranslationContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: { [key: string]: string };
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getLanguageSettings().selectedLanguage as Language);

  useEffect(() => {
    saveLanguageSettings({ selectedLanguage: language });
  }, [language]);

  const t = translations[language];

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};