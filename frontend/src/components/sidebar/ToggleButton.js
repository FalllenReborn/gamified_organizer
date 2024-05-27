import React from 'react';
import { TbLayoutSidebarLeftCollapseFilled, TbLayoutSidebarLeftExpandFilled } from 'react-icons/tb';
import styles from './toggleButton.module.css';

const ToggleButton = ({ onClick, isVisible }) => {
  return (
    <button className={`${styles.toggleButton} ${!isVisible && styles.hidden}`} onClick={onClick}>
      {isVisible ? <TbLayoutSidebarLeftCollapseFilled /> : <TbLayoutSidebarLeftExpandFilled />}
    </button>
  );
};

export default ToggleButton;