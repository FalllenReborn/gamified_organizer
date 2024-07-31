interface ThemeSettings {
  isDarkMode: boolean;
}

interface LanguageSettings {
  selectedLanguage: string;
}

export const getThemeSettings = (): ThemeSettings => {
  const settingsJson = localStorage.getItem('themeSettings');
  if (settingsJson) {
    return JSON.parse(settingsJson) as ThemeSettings;
  } else {
    return { isDarkMode: false };
  }
};

export const saveThemeSettings = (settings: ThemeSettings): void => {
  localStorage.setItem('themeSettings', JSON.stringify(settings));
};

export const getLanguageSettings = (): LanguageSettings => {
  const settingsJson = localStorage.getItem('languageSettings');
  if (settingsJson) {
    return JSON.parse(settingsJson) as LanguageSettings;
  } else {
    return { selectedLanguage: 'english' };
  }
};

export const saveLanguageSettings = (settings: LanguageSettings): void => {
  localStorage.setItem('languageSettings', JSON.stringify(settings));
};