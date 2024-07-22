import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import styles from './createBarPopup.module.css';

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

interface Bar {
  bar_id: number;
  bar_name: string;
  xp_name: string;
  full_cycle: number;
  transactions: { [currencyId: number]: number };
  vouchers: { [itemId: number]: number };
  size_vertical: number;
  size_horizontal: number;
  x_axis: number;
  y_axis: number;
}

interface CreateBarPopupProps {
  onClose: () => void;
  onConfirm: (
    barName: string,
    xpName: string,
    fullCycle: number,
    sizeVertical: number,
    sizeHorizontal: number,
    xAxis: number,
    yAxis: number,
    transactions: { [currencyId: number]: number },
    vouchers: { [itemId: number]: number },
  ) => Promise<void>;
  onUpdate: (
    barId: number,
    barName: string,
    xpName: string,
    fullCycle: number,
    sizeVertical: number,
    sizeHorizontal: number,
    xAxis: number,
    yAxis: number,
    transactions: { [currencyId: number]: number },
    vouchers: { [itemId: number]: number },
  ) => Promise<void>;
  currencies: Currency[];
  items: Item[]
  isEditMode: boolean;
  barToEdit?: Bar | null;
}

const CreateBarPopup: React.FC<CreateBarPopupProps> = ({
  onClose,
  onConfirm,
  onUpdate,
  currencies,
  items,
  isEditMode,
  barToEdit,
}) => {
  const [barName, setBarName] = useState<string>('');
  const [xpName, setXpName] = useState<string>('');
  const [fullCycle, setFullCycle] = useState<string>('');
  const [transactions, setTransactions] = useState<{ [currencyId: number]: number }>({});
  const [vouchers, setVouchers] = useState<{ [itemId: number]: number }>({});
  const [sizeVertical, setSizeVertical] = useState<number>(125);
  const [sizeHorizontal, setSizeHorizontal] = useState<number>(300);
  const [xAxis, setXAxis] = useState<number>(0);
  const [yAxis, setYAxis] = useState<number>(0);

  useEffect(() => {
    if (isEditMode && barToEdit) {
      setBarName(barToEdit.bar_name);
      setXpName(barToEdit.xp_name);
      setFullCycle(barToEdit.full_cycle.toString());
      setTransactions(barToEdit.transactions);
      setVouchers(barToEdit.vouchers);
      setSizeVertical(barToEdit.size_vertical);
      setSizeHorizontal(barToEdit.size_horizontal);
      setXAxis(barToEdit.x_axis);
      setYAxis(barToEdit.y_axis);
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

  const handleVoucherChange = (itemId: number, value: string) => {
    setVouchers((prevVouchers) => ({
      ...prevVouchers,
      [itemId]: parseInt(value, 10) || 0,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (parseInt(fullCycle) <= 0) {
      alert('Full cycle must be a positive number');
      return;
    }
    try {
      if (isEditMode && barToEdit) {
        await onUpdate(
          barToEdit.bar_id,
          barName,
          xpName,
          parseInt(fullCycle),
          sizeVertical,
          sizeHorizontal,
          xAxis,
          yAxis,
          transactions,
          vouchers
        );
      } else {
        await onConfirm(
          barName,
          xpName,
          parseInt(fullCycle),
          sizeVertical,
          sizeHorizontal,
          xAxis,
          yAxis,
          transactions,
          vouchers
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
    setSizeVertical(125);
    setSizeHorizontal(300);
    setXAxis(0);
    setYAxis(0);
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setter(e.target.value);
  };

  const handleSizeChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 50) {
      setter(value);
    }
  };

  const handleAxisChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setter(parseInt(e.target.value, 10));
  };

  const stopPropagation = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.popupOverlay} onWheel={stopPropagation}>
      <div className={styles.popup}>
        <div className={styles.header}>
          <h2>{isEditMode ? 'Edit Bar' : 'Create Bar'}</h2>
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
        <div className={styles.columns}>
          <div className={styles.columnBar}>
            <h3>Properties</h3>
            <form className={styles.form}>
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
              <h4>Item vouchers</h4>
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
          <button className={styles.cancelButton} type="button" onClick={onClose}>
            Cancel
          </button>
          <button className={styles.confirmButton} type="submit" onClick={handleSubmit}>
            {isEditMode ? 'Update Bar' : 'Create Bar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateBarPopup;