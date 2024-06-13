import React, { useState } from 'react';
import styles from './createTaskPopup.module.css';

interface CreateTaskPopupProps {
  onClose: () => void;
  onConfirm: (taskName: string) => void;
}

const CreateTaskPopup: React.FC<CreateTaskPopupProps> = ({ onClose, onConfirm }) => {
  const [taskName, setTaskName] = useState('');

  const handleConfirm = () => {
    onConfirm(taskName);
  };

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <h2>Create New Task</h2>
        </div>
        <form className={styles.form}>
          <label className={styles.label} htmlFor="taskName">Task Name</label>
          <input
            className={styles.input}
            type="text"
            id="taskName"
            name="taskName"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
        </form>
        <div className={styles.columns}>
          <div className={styles.column}>
            <h3>Properties</h3>
            {/* Properties content will go here */}
          </div>
          <div className={styles.column}>
            <h3>Rewards</h3>
            {/* Rewards content will go here */}
          </div>
        </div>
        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
          <button className={styles.confirmButton} onClick={handleConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskPopup;
