export interface AppSettings {
  isDarkMode: boolean;
  selectedLanguage: string;
}

export const getSettings = (): AppSettings => {
  const settingsJson = localStorage.getItem('appSettings');
  if (settingsJson) {
    return JSON.parse(settingsJson) as AppSettings;
  } else {
    return { isDarkMode: false, selectedLanguage: 'english' };
  }
};

export const saveSettings = (settings: AppSettings): void => {
  localStorage.setItem('appSettings', JSON.stringify(settings));
};
