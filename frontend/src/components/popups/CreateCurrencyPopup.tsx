import React, { useState, useEffect, FC } from 'react';
import styles from './createCurrencyPopup.module.css';

interface CreateCurrencyProps {
  isOpen: boolean;
  defaultValue: string;
  isEditMode: boolean; // New prop to indicate edit mode
  onCreate: (newName: string) => Promise<void>;
  onEdit: (currencyId: number, newName: string) => Promise<void>;
  onQuit: () => void;
  currencyId?: number; // New optional prop for currency ID
}

const CreateCurrencyPopup: FC<CreateCurrencyProps> = ({ isOpen, defaultValue, isEditMode, onCreate, onEdit, onQuit, currencyId }) => {
  const [name, setName] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setName(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSave = async () => {
    if (isEditMode && currencyId !== undefined) {
      await onEdit(currencyId, name); // Call onEdit for edit mode
    } else {
      await onCreate(name); // Call onCreate for create mode
    }
    onQuit();
  };

  const stopPropagation = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    isOpen && (
      <div className={styles.overlay} onWheel={stopPropagation}>
        <div className={styles.popup}>
          <h3>{isEditMode ? 'Edit Currency' : 'New Currency'}</h3>
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