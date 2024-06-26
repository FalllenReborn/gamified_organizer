import React, { useState } from 'react';
import styles from './createTaskPopup.module.css';

interface bar {
  bar_id: number;
  bar_name: string;
  xp_name: string;
  x_axis: number;
  y_axis: number;
  size_horizontal: number;
  size_vertical: number;
  zindex: number;
  full_cycle: number;
  total_points: number;
}

interface currency {
  currency_id: number;
  currency_name: string;
  owned: number;
}

interface CreateTaskPopupProps {
  onClose: () => void;
  onConfirm: (taskName: string, rewards: { [barId: number]: number }, transactions: { [currencyId: number]: number }) => void;
  bars: bar[];
  currencies: currency[];
}

const CreateTaskPopup: React.FC<CreateTaskPopupProps> = ({ onClose, onConfirm, bars, currencies }) => {
  const [taskName, setTaskName] = useState('');
  const [rewards, setRewards] = useState<{ [barId: number]: number }>({});
  const [transactions, setTransactions] = useState<{ [currencyId: number]: number }>({});

  const handleRewardChange = (barId: number, value: string) => {
    setRewards((prevRewards) => ({
      ...prevRewards,
      [barId]: parseInt(value, 10) || 0,
    }));
  };

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

  const handleConfirm = () => {
    onConfirm(taskName, rewards, transactions);
  };

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <h2>Create New Task</h2>
        </div>
        <form className={styles.form}>
          <label className={styles.label} htmlFor="taskName">Task Name</label>
          <input
            className={styles.input}
            type="text"
            id="taskName"
            name="taskName"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
        </form>
        <div className={styles.columns}>
          <div className={styles.column}>
            <h3>Properties</h3>
            {/* Properties content will go here */}
          </div>
          <div className={styles.column}>
            <h3>Rewards</h3>
            <div className={styles.rewardsBox}>
              <h4>Progress bars</h4>
              {bars.map((bar) => (
                <div key={bar.bar_id} className={styles.rewardRow}>
                  <span className={styles.rewardName}>{bar.bar_name}</span>
                  <input
                    className={styles.rewardInput}
                    type="number"
                    value={rewards[bar.bar_id] || ''}
                    onChange={(e) => handleRewardChange(bar.bar_id, e.target.value)}
                  />
                </div>
              ))}
            </div>
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
          <button className={styles.cancelButton} onClick={onClose}>Cancel</button>
          <button className={styles.confirmButton} onClick={handleConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskPopup;
