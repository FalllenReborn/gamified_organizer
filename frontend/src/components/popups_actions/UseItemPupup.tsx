import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import styles from './useItemPupup.module.css'

interface UseItemPopupProps {
  show: boolean;
  onConfirm: (useNote: string, useQuantity: number) => void;
  onCancel: () => void;
  maxQuantity: number;
}

const UseItemPopup: React.FC<UseItemPopupProps> = ({ show, onConfirm, onCancel, maxQuantity }) => {
  const { t } = useTranslation();
  const [useMany, setUseMany] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (quantity < 1) {
      setQuantity(1);
    } else if (quantity > maxQuantity) {
      setQuantity(maxQuantity);
    }
  }, [quantity, maxQuantity]);

  if (!show) {
    return null;
  }

  const handleConfirm = () => {
    onConfirm(note, quantity);
    setNote('');
    setCharCount(0);
    setQuantity(1);
    setUseMany(false);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    setCharCount(e.target.value.length);
  };

  const stopPropagation = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  const isConfirmDisabled = useMany && (quantity < 1 || quantity > maxQuantity);

  return (
    <div className={styles.popupOverlay} onWheel={stopPropagation}>
      <div className={styles.popup}>
        <h2>{t.useItem}</h2>
        <div className={styles.quantity}>
          <div className={styles.checkboxContainer}>
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                onChange={() => setUseMany(!useMany)}
                checked={useMany}
              />
            </div>
            <div className={styles.checkboxLabel}>{t.useMany}?</div>
          </div>
          {useMany && (
            <input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className={styles.numericInput}
            />
          )}
        </div>
        <div className={styles.textareaContainer}>
          <label className={styles.textareaLabel}>{t.useNote}</label>
          <textarea
            maxLength={500}
            value={note}
            onChange={handleNoteChange}
            placeholder={t.enterNote}
            className={styles.textarea}
          />
          <div className={styles.charCount}>{charCount}/500</div>
        </div>
        <div className={styles.buttons}>
          <button className={styles.cancelButton} onClick={onCancel}>{t.cancel}</button>
          <button className={styles.confirmButton} onClick={handleConfirm} disabled={isConfirmDisabled}>{t.confirm}</button>
        </div>
      </div>
    </div>
  );
};

export default UseItemPopup;