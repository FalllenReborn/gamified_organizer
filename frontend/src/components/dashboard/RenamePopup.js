import React, { useState, useEffect } from 'react';
import styles from './renamePopup.module.css';
import axios from 'axios';

const RenamePopup = ({ isOpen, id, defaultValue, onSave, onClose }) => {
  const [name, setName] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setName(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSave = async () => {
    try {
      const response = await axios.patch(`http://localhost:8000/api/tasklists/${id}/`, { list_name: name });
      console.log('Response:', response);
      onSave(id, name); // Call onSave after successful API request
      onClose();
    } catch (error) {
      console.error('Error updating list name:', error.response ? error.response.data : error.message);
      // Handle error
    }
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
