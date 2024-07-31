import React, { useState, useEffect, FC } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import styles from './createCurrencyPopup.module.css';

interface CreateCurrencyProps {
  isOpen: boolean;
  defaultValue: string;
  isEditMode: boolean;
  onCreate: (newName: string) => Promise<void>;
  onEdit: (currencyId: number, newName: string) => Promise<void>;
  onQuit: () => void;
  currencyId?: number;
}

const CreateCurrencyPopup: FC<CreateCurrencyProps> = ({ isOpen, defaultValue, isEditMode, onCreate, onEdit, onQuit, currencyId }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultValue);

  useEffect(() => {
    if (isOpen) {
      setName(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleSave = async () => {
    if (isEditMode && currencyId !== undefined) {
      await onEdit(currencyId, name);
    } else {
      await onCreate(name);
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
          <h3>{isEditMode ? `${t.editCurrency}` : `${t.newCurrency}`}</h3>
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

export default CreateCurrencyPopup;