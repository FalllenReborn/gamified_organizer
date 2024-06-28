import React, { useState, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import styles from './createBarPopup.module.css';

interface currency {
  currency_id: number;
  currency_name: string;
  owned: number;
}

interface CreateBarPopupProps {
  onClose: () => void;
  onConfirm: (
    barName: string, 
    xpName: string, 
    fullCycle: number, 
    partialCycle1: number | null, 
    partialCycle2: number | null, 
    partialCycle3: number | null,
    transactions: { [currencyId: number]: number },
  ) => Promise<void>;
  currencies: currency[];
}

const CreateBarPopup: React.FC<CreateBarPopupProps> = ({ 
  onClose, 
  onConfirm,
  currencies,
}) => {
  const [barName, setBarName] = useState<string>('');
  const [xpName, setXpName] = useState<string>('');
  const [fullCycle, setFullCycle] = useState<string>('');
  const [partialCycle1, setPartialCycle1] = useState<string>('');
  const [partialCycle2, setPartialCycle2] = useState<string>('');
  const [partialCycle3, setPartialCycle3] = useState<string>('');
  const [transactions, setTransactions] = useState<{ [currencyId: number]: number }>({});

  const handleTransactionChange = (currencyId: number, value: string) => {
    // Validate number with up to 2 decimal places
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === '') {
      setTransactions((prevTransactions) => ({
        ...prevTransactions,
        [currencyId]: parseFloat(value) || 0,
      }));
    }
  };

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
        partialCycle3 ? parseInt(partialCycle3) : null,
        transactions
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
        <div className={styles.columns}>
          <div className={styles.columnBar}>
            <h3>Properties</h3>
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
            </form>
          </div>
          <div className={styles.columnPrizes}>
            <div className={styles.rewardsBox}>
              <h4>Currency transactions</h4>
              {currencies.map((currency) => (
                <div key={currency.currency_id} className={styles.rewardRow}>
                  <span className={styles.rewardName}>{currency.currency_name}</span>
                  <input
                    className={styles.rewardInput}
                    type="text"
                    value={transactions[currency.currency_id] || ''}
                    onChange={(e) => handleTransactionChange(currency.currency_id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.footer}>
            <button className={styles.cancelButton} type="button" onClick={onClose}>Cancel</button>
            <button className={styles.confirmButton} type="submit" onClick={handleSubmit}>Create Bar</button>
        </div>
      </div>
    </div>
  )
};

export default CreateBarPopup;
