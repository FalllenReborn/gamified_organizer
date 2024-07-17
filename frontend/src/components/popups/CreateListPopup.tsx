import React, { useState, useEffect, FC } from 'react';
import styles from './createListPopup.module.css';

interface CreateListPopupProps {
  isOpen: boolean;
  id: number | null;
  defaultValue: string;
  defaultX: number;
  defaultY: number;
  defaultWidth: number;
  defaultHeight: number;
  onSave: (id: number | null, newName: string, x: number, y: number, width: number, height: number) => void;
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
  onSave, 
  onClose 
}) => {
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
    onSave(id, name, xAxis, yAxis, sizeHorizontal, sizeVertical);
    onClose();
  };

  const stopPropagation = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    isOpen && (
      <div className={styles.overlay} onWheel={stopPropagation}>
        <div className={styles.popup}>
          <h3>{id !== null ? 'Edit List' : 'Create List'}</h3>
          <form className={styles.form}>
            <label className={styles.label}>
              Name:
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter new name"
              />
            </label>
            <label className={styles.label}>
              Size Vertical:
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
              Size Horizontal:
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
              X Axis:
              <input
                className={styles.input}
                type="number"
                value={xAxis}
                onChange={handleAxisChange(setXAxis)}
                required
              />
            </label>
            <label className={styles.label}>
              Y Axis:
              <input
                className={styles.input}
                type="number"
                value={yAxis}
                onChange={handleAxisChange(setYAxis)}
                required
              />
            </label>
          </form>
          <button className="btn btn-primary" onClick={handleSaveClick}>Save</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    )
  );
};

export default CreateListPopup;