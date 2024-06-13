import React, { useState, useEffect, FC } from 'react';
import styles from './renamePopup.module.css';
import axios, { AxiosError } from 'axios';

interface RenamePopupProps {
  isOpen: boolean;
  id: number | null;
  defaultValue: string;
  onSave: (id: number, newName: string) => Promise<void>;
  onClose: () => void;
}

const RenamePopup: FC<RenamePopupProps> = ({ isOpen, id, defaultValue, onSave, onClose }) => {
  const [name, setName] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setName(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSave = async () => {
    if (id === null) return;
    try {
      const response = await axios.patch(`http://localhost:8000/api/tasklists/${id}/`, { list_name: name });
      console.log('Response:', response);
      onSave(id, name); // Call onSave after successful API request
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error updating list name:', error.response ? error.response.data : error.message);
      } else {
        console.error('Non-Axios error occurred:', error);
      }
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
