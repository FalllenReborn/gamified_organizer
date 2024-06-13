import React from 'react';
import { TbLayoutSidebarLeftCollapseFilled, TbLayoutSidebarLeftExpandFilled } from 'react-icons/tb';
import styles from './toggleButton.module.css';

interface ToggleButtonProps {
  onClick: () => void;
  isVisible: boolean;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ onClick, isVisible }) => {
  return (
    <button className={`${styles.toggleButton} ${!isVisible && styles.hidden}`} onClick={onClick}>
      {isVisible ? <TbLayoutSidebarLeftCollapseFilled /> : <TbLayoutSidebarLeftExpandFilled />}
    </button>
  );
};

export default ToggleButton;
