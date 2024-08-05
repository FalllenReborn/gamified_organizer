import React, { useState, useEffect, FC } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import styles from './createCurrencyPopup.module.css';

interface CreateCurrencyProps {
  isOpen: boolean;
  defaultValue: string;
  defaultRate: number | null;
  defaultLoss: number
  isEditMode: boolean;
  onCreate: (newName: string, newRate: number | null, newLoss: number) => Promise<void>;
  onEdit: (currencyId: number, newName: string, newRate: number | null, newLoss: number) => Promise<void>;
  onQuit: () => void;
  currencyId?: number;
}

const CreateCurrencyPopup: FC<CreateCurrencyProps> = ({ 
  isOpen, 
  defaultValue, 
  defaultRate,
  defaultLoss,
  isEditMode, 
  onCreate, 
  onEdit, 
  onQuit, 
  currencyId 
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultValue);
  const [rate, setRate] = useState(defaultRate)
  const [loss, setLoss] = useState(defaultLoss)

  useEffect(() => {
    if (isOpen) {
      setName(defaultValue);
      setRate(defaultRate);
      setLoss(defaultLoss);
    }
  }, [isOpen, defaultValue, defaultRate, defaultLoss]);

  const handleRateChange = (setter: React.Dispatch<React.SetStateAction<number | null>>) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setter(value === '' ? null : Math.max(0, parseFloat(value)));
  };

  const handleLossChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0) {
      value = 0;
    } else if (value > 1) {
      value = 1;
    }
    setter(value);
  };

  const handleSave = async () => {
    if (isEditMode && currencyId !== undefined) {
      await onEdit(currencyId, name, rate, loss);
    } else {
      await onCreate(name, rate, loss);
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
          <form className={styles.form}>
            <label className={styles.label}>
              {t.name}:
              <input
                className={styles.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.enterName}
              />
            </label>
            <label className={styles.label}>
              {t.rate} (0 = Non-Exchangable):
              <input
                className={styles.input}
                type="number"
                value={rate !== null ? rate : ''}
                onChange={handleRateChange(setRate)}
              />
            </label>
            <label className={styles.label}>
              {t.loss}:
              <input
                className={styles.input}
                type="number"
                value={loss}
                onChange={handleLossChange(setLoss)}
                step="0.01"
                min="0"
                max="1"
              />
            </label>
          </form>
          <button className="btn btn-primary" onClick={handleSave}>{t.confirm}</button>
          <button className="btn btn-secondary" onClick={onQuit}>{t.cancel}</button>
        </div>
      </div>
    )
  );
};

export default CreateCurrencyPopup;