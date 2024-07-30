import React, { useState, useEffect } from 'react';
import styles from './useItemPupup.module.css'

interface UseItemPopupProps {
  show: boolean;
  onConfirm: (useNote: string, useQuantity: number) => void;
  onCancel: () => void;
  maxQuantity: number;
}

const UseItemPopup: React.FC<UseItemPopupProps> = ({ show, onConfirm, onCancel, maxQuantity }) => {
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
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    setCharCount(e.target.value.length);
  };

  const isConfirmDisabled = useMany && (quantity < 1 || quantity > maxQuantity);

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popup}>
        <h2>Use Item</h2>
        <div className={styles.quantity}>
          <div className={styles.checkboxContainer}>
            <div className={styles.checkbox}>
              <input
                type="checkbox"
                onChange={() => setUseMany(!useMany)}
                checked={useMany}
              />
            </div>
            <div className={styles.checkboxLabel}>Use many?</div>
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
          <label className={styles.textareaLabel}>Use reason. Write why/how have you used your item.</label>
          <textarea
            maxLength={500}
            value={note}
            onChange={handleNoteChange}
            placeholder="Enter a note (optional)"
            className={styles.textarea}
          />
          <div className={styles.charCount}>{charCount}/500</div>
        </div>
        <div className={styles.buttons}>
          <button className={styles.cancelButton} onClick={onCancel}>Cancel</button>
          <button className={styles.confirmButton} onClick={handleConfirm} disabled={isConfirmDisabled}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default UseItemPopup;