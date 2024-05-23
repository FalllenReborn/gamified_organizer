export const getSettings = () => {
    const settings = localStorage.getItem('appSettings');
    return settings ? JSON.parse(settings) : { isDarkMode: false, selectedLanguage: 'english' };
  };
  
  export const saveSettings = (settings) => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
  };