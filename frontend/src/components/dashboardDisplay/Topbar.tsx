import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';
import LoginPopup from '../authentication/LoginPopup';
import RegisterPopup from '../authentication/RegisterPopup';
import styles from './topbar.module.css';
import classNames from 'classnames';

interface TopbarProps {
  onCreateNewList: () => void;
  onCompleteTasks: () => void;
  onDeleteTasks: () => void;
  onReturnHome: () => void;
  onCreateNewBar: () => void;
  onCreateNewShop: () => void;
}

type DropdownState = 'createDropdown' | 'actionsDropdown' | 'languageDropdown' | 'themeDropdown' | 'accountDropdown' | 'navigateDropdown';

type Language = 'english' | 'polish';

const Topbar: React.FC<TopbarProps> = ({ 
  onCreateNewList, 
  onCompleteTasks, 
  onCreateNewBar, 
  onCreateNewShop,
  onDeleteTasks,
}) => {
  const { isDarkMode, toggleDarkMode, toggleLightMode, } = useContext(ThemeContext);
  const { isAuthenticated, logout } = useAuth();
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [showRegisterPopup, setShowRegisterPopup] = useState(false);
  const [dropdownStates, setDropdownStates] = useState<DropdownState | null>(null);
  const { t, setLanguage } = useTranslation();
  const navigate = useNavigate();

  const handleLanguageChange = (language: Language) => {
    setLanguage(language);
  };

  const handleDropdownToggle = (dropdown: DropdownState) => {
    setDropdownStates(prevState => (prevState === dropdown ? null : dropdown));
  };

  const handleMouseEnter = (dropdown: DropdownState) => {
    if (dropdownStates) {
      setDropdownStates(dropdown);
    }
  };

  const handleLoginClick = () => {
    setShowRegisterPopup(false); // Close the register popup
    setShowLoginPopup(true); // Open the login popup
  };

  const handleRegisterClick = () => {
    setShowLoginPopup(false); // Close the login popup
    setShowRegisterPopup(true); // Open the register popup
  };

  const handleClosePopups = () => {
    setShowLoginPopup(false);
    setShowRegisterPopup(false);
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleLogout = () => {
    logout();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className={`${styles.sidebar} ${isDarkMode ? styles.darkMode : styles.lightMode}`} onDragStart={handleDragStart}>
      <div className={styles.dropdownContainer} onMouseEnter={() => handleMouseEnter('createDropdown')} onClick={() => handleDropdownToggle('createDropdown')}>
        <div id={styles.createDropdown} className={classNames(styles.openDropdown, { [styles.active]: dropdownStates === 'createDropdown' })}>{t.create}</div>
        {dropdownStates === 'createDropdown' && (
          <div className={styles.dropdownContent}>
            <div id={styles.createListButton} className={styles.dropdownButton} onClick={onCreateNewList}>{t.createList}</div>
            <div id={styles.createShopButton} className={styles.dropdownButton} onClick={onCreateNewShop}>{t.createShop}</div>
            <div id={styles.createBarButton} className={styles.dropdownButton} onClick={onCreateNewBar}>{t.createXP}</div>
          </div>
        )}
      </div>
          
      <div className={styles.dropdownContainer} onMouseEnter={() => handleMouseEnter('actionsDropdown')} onClick={() => handleDropdownToggle('actionsDropdown')}>
        <div id={styles.actionsDropdown} className={classNames(styles.openDropdown, { [styles.active]: dropdownStates === 'actionsDropdown' })}>{t.actions}</div>
        {dropdownStates === 'actionsDropdown' && (
          <div className={styles.dropdownContent}>
            <div id={styles.completeButton} className={styles.dropdownButton} onClick={onCompleteTasks}>{t.completeTasks}</div>
            <div id={styles.deleteButton} className={styles.dropdownButton} onClick={onDeleteTasks}>{t.deleteTasks}</div>
          </div>
        )}
      </div>

      <div className={styles.dropdownContainer} onMouseEnter={() => handleMouseEnter('languageDropdown')} onClick={() => handleDropdownToggle('languageDropdown')}>
        <div id={styles.languageDropdown} className={classNames(styles.openDropdown, { [styles.active]: dropdownStates === 'languageDropdown' })}>{t.language}</div>
        {dropdownStates === 'languageDropdown' && (
          <div className={styles.dropdownContent}>
            <div id={styles.englishButton} className={styles.dropdownButton} onClick={() => handleLanguageChange('english')}>{t.english}</div>
            <div id={styles.polishButton} className={styles.dropdownButton} onClick={() => handleLanguageChange('polish')}>{t.polish}</div>
          </div>
        )}
      </div>

      <div className={styles.dropdownContainer} onMouseEnter={() => handleMouseEnter('themeDropdown')} onClick={() => handleDropdownToggle('themeDropdown')}>
        <div id={styles.themeDropdown} className={classNames(styles.openDropdown, { [styles.active]: dropdownStates === 'themeDropdown' })}>{t.theme}</div>
        {dropdownStates === 'themeDropdown' && (
          <div className={styles.dropdownContent}>
            <div id={styles.lightModeButton} className={classNames(styles.dropdownButton, { [styles.activeTheme]: !isDarkMode })} onClick={toggleLightMode}>
              {t.light} {isDarkMode ? '' : '✔'}
            </div>
            <div id={styles.darkModeButton} className={classNames(styles.dropdownButton, { [styles.activeTheme]: isDarkMode })} onClick={toggleDarkMode}>
              {t.dark} {isDarkMode ? '✔' : ''}
            </div>
          </div>
        )}
      </div>

      <div className={styles.dropdownContainer} onMouseEnter={() => handleMouseEnter('accountDropdown')} onClick={() => handleDropdownToggle('accountDropdown')}>
        <div id={styles.accountDropdown} className={classNames(styles.openDropdown, { [styles.active]: dropdownStates === 'accountDropdown' })}>{t.account}</div>
        {dropdownStates === 'accountDropdown' && (
          <div className={styles.dropdownContent}>
            {isAuthenticated ? (
              <div id={styles.logoutButton} className={styles.dropdownButton} onClick={handleLogout}>{t.logout}</div>
            ) : (
              <>
                <div id={styles.loginButton} className={styles.dropdownButton} onClick={handleLoginClick}>{t.login}</div>
                <div id={styles.registerButton} className={styles.dropdownButton} onClick={handleRegisterClick}>{t.register}</div>
              </>
            )}
          </div>
        )}
      </div>

      <div className={styles.dropdownContainer} onMouseEnter={() => handleMouseEnter('navigateDropdown')} onClick={() => handleDropdownToggle('navigateDropdown')}>
        <div id={styles.navigateDropdown} className={classNames(styles.openDropdown, { [styles.active]: dropdownStates === 'navigateDropdown' })}>{t.navigate}</div>
        {dropdownStates === 'navigateDropdown' && (
          <div className={styles.dropdownContent}>
            <div id={styles.homeButton} className={styles.dropdownButton} onClick={handleReturnHome}>{t.home}</div>
            <div id={styles.settingsButton} className={styles.dropdownButton}>{t.settings}</div>
          </div>
        )}
      </div>

      {showLoginPopup && <LoginPopup show={true} isOpen={true} onClose={handleClosePopups} onOpenRegister={handleRegisterClick} />}
      {showRegisterPopup && <RegisterPopup show={true} isOpen={true} onClose={handleClosePopups} onOpenLogin={handleLoginClick} />}
    </div>
  );
};

export default Topbar;
