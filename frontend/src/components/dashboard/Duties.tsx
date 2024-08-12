import React, { useState } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import { FaTasks } from "react-icons/fa";
import styles from './duties.module.css';

interface Duty {
    task_id: number;
    task_name: string;
    list_task: number;
    created_date_time: string;
    nested_id: number | null;
    expanded: boolean;
}

interface DutiesProps {
    duties: Duty[];
    rewards: any[];
    transactions: any[];
    vouchers: any[];
    barsData: any[];
    currencies: any[];
    items: any[];
    onEdit: (windowId: number | null, nest_id: number | null, editMode: any, task: any) => void;
    onComplete: (task: any) => void;
    onDelete: (task: any) => void;
}

const Duties: React.FC<DutiesProps> = ({
    duties,
    rewards,
    transactions,
    vouchers,
    barsData,
    currencies,
    items,
    onEdit,
    onComplete,
    onDelete,
}) => {
    const { t } = useTranslation();
    const [isDetailView, setIsDetailView] = useState(true);
    const [hoveredTask, setHoveredTask] = useState<number | null>(null);
    const [isHidden, setIsHidden] = useState(false);

    const getRewardsForTask = (taskId: number) => {
        return rewards.filter((reward) => reward.task === taskId);
    };
    
    const getTransactionsForTask = (taskId: number) => {
        return transactions.filter((transaction) => transaction.task === taskId);
    };
    
    const getVouchersForTask = (taskId: number) => {
        return vouchers.filter((voucher) => voucher.task === taskId);
    };
    
    const getXPName = (barId: number) => {
        const bar = barsData.find(bar => bar.bar_id === barId);
        return bar ? bar.xp_name : 'XP';
    };

    const getCurrencyName = (currencyId: number) => {
        const currency = currencies.find(currency => currency.currency_id === currencyId);
        return currency ? currency.currency_name : 'Currency';
    };

    const getItemName = (itemId: number) => {
        const item = items.find(item => item.item_id === itemId);
        return item ? item.item_name : 'Item';
    };

    const handleEditDuty = (taskId: number) => {
        const duty = duties.find(t => t.task_id === taskId);
        if (duty) {
          onEdit(null, null, true, duty);
        }
      };
    
    return (
        <div className={styles.duties} style={{ 
            width: isHidden ? '40px' : '450px',
            height:  isHidden ? '40px' : '350px',
        }}>
            {!isHidden && 
                <>
                    <div className={styles.taskbar}>
                        <div className={styles.classicViewHeader} style={{ width: isDetailView ? '40%' : '100%' }}>
                            <div className={styles.buttons}>
                                <button className={styles.addButton} onClick={() => {onEdit(null, null, false, null)}}>
                                    +
                                </button>
                            </div>
                            <span className={styles.title}>{t.duties}</span>
                            <div className={styles.arrow} onClick={() => setIsDetailView(!isDetailView)}>
                                {isDetailView ? '»' : '«'}
                            </div>
                        </div>
                        {isDetailView && (
                            <div className={styles.detailViewHeaders}>
                                <div className={styles.columnHeader} id={styles.progressHeader}>{t.progress}</div>
                                <div className={styles.columnHeader} id={styles.currenciesHeader}>{t.currencies}</div>
                                <div className={styles.columnHeader} id={styles.itemsHeader}>{t.items}</div>
                            </div>
                        )}
                    </div>
                    <div className={styles.content}>
                        {duties.map((duty) => (
                            <div key={duty.task_id} className={styles.taskContainer}>
                                <div className={styles.dutyRow}>
                                    <div className={styles.dutyCell}>
                                        <div 
                                            className={styles.classicView} 
                                            style={{ width: isDetailView ? '40%' : '100%' }}
                                            onMouseEnter={() => setHoveredTask(duty.task_id)} 
                                            onMouseLeave={() => setHoveredTask(null)}
                                        >
                                            <div className={styles.taskText}>{duty.task_name}</div>
                                            {hoveredTask === duty.task_id && (
                                                <div className={styles.buttonContainer}>
                                                    <button className={styles.completeButton} onClick={() => onComplete(duty.task_id)}>{t.complete}</button>
                                                    <button className={styles.deleteButton} onClick={() => onDelete(duty.task_id)}>{t.delete}</button>
                                                    <button className={styles.editButton} onClick={() => handleEditDuty(duty.task_id)}>{t.edit}</button>
                                                </div>
                                            )}
                                        </div>
                                        {isDetailView && (
                                            <div className={styles.detailView}>
                                                <div className={styles.column} id={styles.progress}>
                                                    <div className={styles.rewards}>
                                                        {getRewardsForTask(duty.task_id).map((reward) => (
                                                            <span key={reward.reward_id} className={styles.reward}>
                                                                {getXPName(reward.bar)}: {reward.points}<br />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className={styles.column} id={styles.currencies}>
                                                    <div className={styles.transactions}>
                                                        {getTransactionsForTask(duty.task_id).map((transaction) => (
                                                            <span key={transaction.transaction_id} className={styles.transaction}>
                                                                {getCurrencyName(transaction.currency)}: {transaction.amount}<br />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className={styles.column} id={styles.items}>
                                                    <div className={styles.vouchers}>
                                                        {getVouchersForTask(duty.task_id).map((voucher) => (
                                                            <span key={voucher.voucher_id} className={styles.voucher}>
                                                                {getItemName(voucher.item)}: {voucher.quantity}<br />
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div> 
                </> 
            }
            <div className={styles.connector}></div>
            <div 
                className={`${styles.hideButton} ${isHidden ? '' : styles.bordered}`} 
                onClick={() => setIsHidden(!isHidden)}
            >
                {isHidden ? <FaTasks /> : '▼'}
            </div>
        </div>
    );
};

export default Duties;