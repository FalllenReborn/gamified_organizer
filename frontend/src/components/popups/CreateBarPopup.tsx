import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import styles from './createBarPopup.module.css';

interface Currency {
  currency_id: number;
  currency_name: string;
  owned: number;
}

interface Bar {
  bar_id: number;
  bar_name: string;
  xp_name: string;
  full_cycle: number;
  transactions: { [currencyId: number]: number };
}

interface CreateBarPopupProps {
  onClose: () => void;
  onConfirm: (
    barName: string, 
    xpName: string, 
    fullCycle: number, 
    transactions: { [currencyId: number]: number },
  ) => Promise<void>;
  onUpdate: (
    barId: number,
    barName: string, 
    xpName: string, 
    fullCycle: number, 
    transactions: { [currencyId: number]: number },
  ) => Promise<void>;
  currencies: Currency[];
  isEditMode: boolean;
  barToEdit?: Bar | null;
}

const CreateBarPopup: React.FC<CreateBarPopupProps> = ({ 
  onClose, 
  onConfirm,
  onUpdate,
  currencies,
  isEditMode,
  barToEdit,
}) => {
  const [barName, setBarName] = useState<string>('');
  const [xpName, setXpName] = useState<string>('');
  const [fullCycle, setFullCycle] = useState<string>('');
  const [transactions, setTransactions] = useState<{ [currencyId: number]: number }>({});

  useEffect(() => {
    if (isEditMode && barToEdit) {
      setBarName(barToEdit.bar_name);
      setXpName(barToEdit.xp_name);
      setFullCycle(barToEdit.full_cycle.toString());
      setTransactions(barToEdit.transactions);
    }
  }, [isEditMode, barToEdit]);

  const handleTransactionChange = (currencyId: number, value: string) => {
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
      if (isEditMode && barToEdit) {
        await onUpdate(
          barToEdit.bar_id,
          barName,
          xpName,
          parseInt(fullCycle),
          transactions
        );
      } else {
        await onConfirm(
          barName,
          xpName,
          parseInt(fullCycle),
          transactions
        );
      }
      clearForm();
    } catch (error) {
      console.error('Error creating/updating bar:', error);
    }
  };

  const clearForm = () => {
    setBarName('');
    setXpName('');
    setFullCycle('');
    setTransactions({});
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
  };

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <h2>{isEditMode ? 'Edit Bar' : 'Create Bar'}</h2>
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
            <button className={styles.confirmButton} type="submit" onClick={handleSubmit}>
              {isEditMode ? 'Update Bar' : 'Create Bar'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBarPopup;