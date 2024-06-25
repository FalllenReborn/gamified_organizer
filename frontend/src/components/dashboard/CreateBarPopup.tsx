import React, { useState, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import styles from './createBarPopup.module.css';

interface CreateBarPopupProps {
  onClose: () => void;
  onConfirm: (barName: string, xpName: string, fullCycle: number, partialCycle1: number | null, partialCycle2: number | null, partialCycle3: number | null) => Promise<void>;
}

const CreateBarPopup: React.FC<CreateBarPopupProps> = ({ onClose, onConfirm }) => {
  const [barName, setBarName] = useState<string>('');
  const [xpName, setXpName] = useState<string>('');
  const [fullCycle, setFullCycle] = useState<string>('');
  const [partialCycle1, setPartialCycle1] = useState<string>('');
  const [partialCycle2, setPartialCycle2] = useState<string>('');
  const [partialCycle3, setPartialCycle3] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (parseInt(fullCycle) <= 0) {
      alert("Full cycle must be a positive number");
      return;
    }
    try {
      await onConfirm(
        barName,
        xpName,
        parseInt(fullCycle),
        partialCycle1 ? parseInt(partialCycle1) : null,
        partialCycle2 ? parseInt(partialCycle2) : null,
        partialCycle3 ? parseInt(partialCycle3) : null
      );
      clearForm();
    } catch (error) {
      console.error('Error creating bar:', error);
    }
  };

  const clearForm = () => {
    setBarName('');
    setXpName('');
    setFullCycle('');
    setPartialCycle1('');
    setPartialCycle2('');
    setPartialCycle3('');
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

    return (
        <div className={styles.popupOverlay}>
            <div className={styles.popup}>
                <div className={styles.header}>
                    <h2>Create Bar Form</h2>
                </div>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <label className={styles.label}>
                    Bar Name:
                    <input
                        className={styles.input}
                        type="text"
                        value={barName}
                        onChange={handleInputChange(setBarName)}
                        required
                    />
                    </label>
                    <label className={styles.label}>
                    XP Name:
                    <input
                        className={styles.input}
                        type="text"
                        value={xpName}
                        onChange={handleInputChange(setXpName)}
                        required
                    />
                    </label>
                    <label className={styles.label}>
                    Full Cycle:
                    <input
                        className={styles.input}
                        type="number"
                        value={fullCycle}
                        onChange={handleInputChange(setFullCycle)}
                        required
                        min="1"
                    />
                    </label>
                    <label className={styles.label}>
                    Partial Cycle #1:
                    <input
                        className={styles.input}
                        type="number"
                        value={partialCycle1}
                        onChange={handleInputChange(setPartialCycle1)}
                        min="1"
                    />
                    </label>
                    <label className={styles.label}>
                    Partial Cycle #2:
                    <input
                        className={styles.input}
                        type="number"
                        value={partialCycle2}
                        onChange={handleInputChange(setPartialCycle2)}
                        min="1"
                    />
                    </label>
                    <label className={styles.label}>
                    Partial Cycle #3:
                    <input
                        className={styles.input}
                        type="number"
                        value={partialCycle3}
                        onChange={handleInputChange(setPartialCycle3)}
                        min="1"
                    />
                    </label>
                    <div className={styles.footer}>
                        <button className={styles.cancelButton} type="button" onClick={onClose}>Cancel</button>
                        <button className={styles.confirmButton} type="submit">Create Bar</button>
                    </div>
                </form>
            </div>
      </div>
    )
};

export default CreateBarPopup;
