import React, { useState, useEffect, FC } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import styles from './createListPopup.module.css';

interface CreateListPopupProps {
  isOpen: boolean;
  id: number | null;
  defaultValue: string;
  defaultX: number;
  defaultY: number;
  defaultWidth: number;
  defaultHeight: number;
  componentType: number;
  onSaveList: (id: number | null, newName: string, x: number, y: number, width: number, height: number) => void;
  onSaveShop: (id: number | null, newName: string, x: number, y: number, width: number, height: number) => void;
  onClose: () => void;
}

const CreateListPopup: FC<CreateListPopupProps> = ({ 
  isOpen, 
  id, 
  defaultValue, 
  defaultX, 
  defaultY, 
  defaultWidth, 
  defaultHeight,
  componentType, 
  onSaveList, 
  onSaveShop,
  onClose 
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(defaultValue);
  const [xAxis, setXAxis] = useState(defaultX);
  const [yAxis, setYAxis] = useState(defaultY);
  const [sizeVertical, setSizeVertical] = useState(defaultHeight);
  const [sizeHorizontal, setSizeHorizontal] = useState(defaultWidth);

  useEffect(() => {
    if (isOpen) {
      setName(defaultValue);
      setXAxis(defaultX);
      setYAxis(defaultY);
      setSizeVertical(defaultHeight);
      setSizeHorizontal(defaultWidth);
    }
  }, [isOpen, defaultValue, defaultX, defaultY, defaultWidth, defaultHeight]);

  const handleSizeChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(50, parseInt(e.target.value, 10) || 0);
    setter(value);
  };

  const handleAxisChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(parseInt(e.target.value, 10) || 0);
  };

  const handleSaveClick = () => {
    if (componentType === 1) {
      onSaveList(id, name, xAxis, yAxis, sizeHorizontal, sizeVertical);
    } else if (componentType === 3) {
      onSaveShop(id, name, xAxis, yAxis, sizeHorizontal, sizeVertical);
    }
      
    onClose();
  };

  const stopPropagation = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    isOpen && (
      <div className={styles.overlay} onWheel={stopPropagation}>
        <div className={styles.popup}>
          <h3>{id !== null ? `${t.editList}` : `${t.createList}`}</h3>
          <form className={styles.form}>
            <label className={styles.label}>
              {t.name}:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.enterName}
              />
            </label>
            <label className={styles.label}>
              {t.sizeV}:
              <input
                className={styles.input}
                type="number"
                value={sizeVertical}
                onChange={handleSizeChange(setSizeVertical)}
                required
                min="50"
              />
            </label>
            <label className={styles.label}>
              {t.sizeH}:
              <input
                className={styles.input}
                type="number"
                value={sizeHorizontal}
                onChange={handleSizeChange(setSizeHorizontal)}
                required
                min="50"
              />
            </label>
            <label className={styles.label}>
              {t.xAxis}:
              <input
                className={styles.input}
                type="number"
                value={xAxis}
                onChange={handleAxisChange(setXAxis)}
                required
              />
            </label>
            <label className={styles.label}>
              {t.yAxis}:
              <input
                className={styles.input}
                type="number"
                value={yAxis}
                onChange={handleAxisChange(setYAxis)}
                required
              />
            </label>
          </form>
          <button className="btn btn-primary" onClick={handleSaveClick}>{t.confirm}</button>
          <button className="btn btn-secondary" onClick={onClose}>{t.cancel}</button>
        </div>
      </div>
    )
  );
};

export default CreateListPopup;