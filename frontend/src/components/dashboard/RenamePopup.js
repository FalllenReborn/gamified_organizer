import React, { useState, useEffect } from 'react';
import styles from './renamePopup.module.css';

const RenamePopup = ({ isOpen, id, defaultValue, onSave, onClose }) => {
  const [name, setName] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setName(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSave = () => {
    onSave(id, name);
    onClose();
  };

  return (
    isOpen && (
      <div className={styles.overlay}>
        <div className={styles.popup}>
          <h3>Rename Window</h3>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter new name"
          />
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    )
  );
};

export default RenamePopup;
