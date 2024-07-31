import React, { useState, useEffect, FC } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import styles from './createItemPopup.module.css';

interface CreateItemProps {
  isOpen: boolean;
  defaultValue: string;
  isEditMode: boolean;
  onCreate: (newName: string) => Promise<void>;
  onEdit: (itemId: number, newName: string) => Promise<void>;
  onQuit: () => void;
  itemId?: number;
}

const CreateItemPopup: FC<CreateItemProps> = ({ isOpen, defaultValue, isEditMode, onCreate, onEdit, onQuit, itemId }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setName(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSave = async () => {
    if (isEditMode && itemId !== undefined) {
      await onEdit(itemId, name); // Call onEdit for edit mode
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
        <h3>{isEditMode ? `${t.newItem}` : `${t.editItem}`}</h3>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.enterName}
          />
          <button className="btn btn-primary" onClick={handleSave}>{t.confirm}</button>
          <button className="btn btn-secondary" onClick={onQuit}>{t.cancel}</button>
        </div>
      </div>
    )
  );
};

export default CreateItemPopup;