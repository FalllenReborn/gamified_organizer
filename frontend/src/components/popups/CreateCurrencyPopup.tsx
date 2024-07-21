import React, { useState, useEffect, FC } from 'react';
import styles from './createCurrencyPopup.module.css';

interface CreateCurrencyProps {
  isOpen: boolean;
  defaultValue: string;
  onCreate: (newName: string) => Promise<void>;
  onQuit: () => void;
}

const CreateCurrencyPopup: FC<CreateCurrencyProps> = ({ isOpen, defaultValue, onCreate, onQuit }) => {
  const [name, setName] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setName(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSave = async () => {
    onCreate(name); // Call onSave after successful API request
    onQuit();
  };

  const stopPropagation = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    isOpen && (
      <div className={styles.overlay} onWheel={stopPropagation}>
        <div className={styles.popup}>
          <h3>New Currency</h3>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter new name"
          />
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
          <button className="btn btn-secondary" onClick={onQuit}>Cancel</button>
        </div>
      </div>
    )
  );
};

export default CreateCurrencyPopup;