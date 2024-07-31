import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import styles from './createTaskPopup.module.css';

interface Layer {
  layer_id: number;
  layer: number;
}

interface Bar {
  bar_id: number;
  bar_name: string;
  xp_name: string;
  x_axis: number;
  y_axis: number;
  size_horizontal: number;
  size_vertical: number;
  layer: Layer;
  full_cycle: number;
  total_points: number;
}

interface Currency {
  currency_id: number;
  currency_name: string;
  owned: number;
}

interface Item {
  item_id: number;
  item_name: string;
  storage: number;
}

interface Task {
  task_id: number;
  task_name: string;
  rewards: { [barId: number]: number };
  transactions: { [currencyId: number]: number };
  vouchers: { [itemId: number]: number };
}

interface Transaction {
  transaction_id: number;
  bar: number;
  task: number;
  currency: number;
  amount: number;
}

interface Voucher {
  voucher_id: number;
  bar: number;
  task: number;
  item: number;
  quantity: number;
}

interface Reward {
  reward_id: number;
  bar: number;
  task: number;
  points: number;
}

interface CreateTaskPopupProps {
  onClose: () => void;
  onConfirm: (
    taskId: number,
    taskName: string,
    rewards: { [barId: number]: number },
    transactions: { [currencyId: number]: number },
    vouchers: { [itemId: number]: number },
  ) => void;
  onUpdate: (
    taskId: number,
    taskName: string,
    rewards: { [barId: number]: number },
    transactions: { [currencyId: number]: number },
    vouchers: { [itemId: number]: number },
  ) => void;
  bars: Bar[];
  currencies: Currency[];
  items: Item[];
  isEditMode: boolean;
  taskToEdit?: Task;
  transactionsProp: Transaction[];
  rewardsProp: Reward[];
  vouchersProp: Voucher[];
}

const CreateTaskPopup: React.FC<CreateTaskPopupProps> = ({
  onClose,
  onConfirm,
  onUpdate,
  bars,
  transactionsProp,
  rewardsProp,
  vouchersProp,
  currencies,
  items,
  isEditMode,
  taskToEdit,
}) => {
  const { t } = useTranslation();
  const [taskName, setTaskName] = useState('');
  const [rewards, setRewards] = useState<{ [barId: number]: number }>({});
  const [vouchers, setVouchers] = useState<{ [itemId: number]: number }>({});
  const [transactions, setTransactions] = useState<{ [currencyId: number]: number }>({});

  useEffect(() => {
    if (isEditMode && taskToEdit) {
      setTaskName(taskToEdit.task_name);
    
      // Initialize rewards state
      const initialRewards: { [barId: number]: number } = {};
      rewardsProp.forEach((reward) => {
        if (reward.task === taskToEdit.task_id) {
          initialRewards[reward.bar] = reward.points;
        }
      });
      setRewards(initialRewards);

      // Initialize transactions state
      const initialTransactions: { [currencyId: number]: number } = {};
      transactionsProp.forEach((transaction) => {
        if (transaction.task === taskToEdit.task_id) {
          initialTransactions[transaction.currency] = transaction.amount;
        }
      });
      setTransactions(initialTransactions);

      const initialVouchers: { [itemId: number]: number } = {};
      vouchersProp.forEach((voucher) => {
        if (voucher.task === taskToEdit.task_id) {
          initialVouchers[voucher.item] = voucher.quantity;
        }
      });
      setVouchers(initialVouchers);
    }
  }, [isEditMode, taskToEdit, rewardsProp, transactionsProp]);

  const handleRewardChange = (barId: number, value: string) => {
    setRewards((prevRewards) => ({
      ...prevRewards,
      [barId]: parseInt(value, 10) || 0,
    }));
  };

  const handleVoucherChange = (itemId: number, value: string) => {
    setVouchers((prevVouchers) => ({
      ...prevVouchers,
      [itemId]: parseInt(value, 10) || 0,
    }));
  };

  const handleTransactionChange = (currencyId: number, value: string) => {
    const regex = /^\d*\.?\d{0,2}$/;
    if (regex.test(value) || value === '') {
      setTransactions((prevTransactions) => ({
        ...prevTransactions,
        [currencyId]: parseFloat(value) || 0,
      }));
    }
  };

  const handleConfirm = () => {
    if (isEditMode && taskToEdit) {
      onConfirm(taskToEdit.task_id, taskName, rewards, transactions, vouchers);
    } else {
      onConfirm(0, taskName, rewards, transactions, vouchers);
    }
  };

  const stopPropagation = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.popupOverlay} onWheel={stopPropagation}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <h2>{isEditMode ? `${t.editTask}` : `${t.createTask}`}</h2>
        </div>
        <form className={styles.form}>
          <label className={styles.label} htmlFor="taskName">{t.taskName}</label>
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
            <h3>{t.properties}</h3>
            {/* Properties content will go here */}
          </div>
          <div className={styles.column}>
            <h3>{t.rewards}</h3>
            <div className={styles.rewardsBox}>
              <h4>{t.progressBars}</h4>
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
              <h4>{t.currencyTransactions}</h4>
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
            <div className={styles.rewardsBox}>
              <h4>{t.itemVouchers}</h4>
              {items.map((item) => (
                <div key={item.item_id} className={styles.rewardRow}>
                  <span className={styles.rewardName}>{item.item_name}</span>
                  <input
                    className={styles.rewardInput}
                    type="text"
                    value={vouchers[item.item_id] || ''}
                    onChange={(e) => handleVoucherChange(item.item_id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>{t.cancel}</button>
          <button className={styles.confirmButton} onClick={handleConfirm}>{t.confirm}</button>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskPopup;