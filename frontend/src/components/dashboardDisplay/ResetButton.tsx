import React from 'react';
import { MdCenterFocusStrong } from "react-icons/md";
import styles from './resetButton.module.css';

interface ResetButtonProps {
  onClick: () => void;
}

const ResetButton: React.FC<ResetButtonProps> = ({ onClick }) => {
  return (
    <button className={`btn btn-light ${styles.resetButton}`} onClick={onClick}>
      <MdCenterFocusStrong />
    </button>
  );
};

export default ResetButton;