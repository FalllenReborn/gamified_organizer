import React, { useState } from 'react';
import styles from './currencies.module.css';

interface CurrenciesProps {
    currencies: any[];
    onCreateNewCurrency: () => void;
    onDeleteCurrency: (id: number) => void;
    onEditCurrency: () => void;
}

const Currencies: React.FC<CurrenciesProps> = ({
    onCreateNewCurrency,
    onDeleteCurrency,
    onEditCurrency,
    currencies,
}) => {
    const [isHidden, setIsHidden] = useState(false);

    const handleHide = async () => {
        setIsHidden(!isHidden);
    };
    
    const sortedCurrencies = [...currencies].sort((a, b) => a.currency_name.localeCompare(b.currency_name));

    return (
        <div className={styles.currenciesBase} style={{ 
            width: isHidden ? '40px' : '200px',
            height:  isHidden ? '40px' : '200px',
        }}>
            <div className={styles.taskBar}>
                {!isHidden && 
                    <>
                        <button className={styles.addButton} onClick={onCreateNewCurrency}>+</button>
                        <div className={styles.title}>Currencies</div>
                    </>
                }
                <div className={styles.hideButton} onClick={handleHide}>
                    {isHidden ? '▼' : '▲'}
                </div>
            </div>
            {!isHidden && (
                <div className={styles.content}>

                    {sortedCurrencies.map((currency, index) => (
                        <div key={index} className={styles.currency}>
                            {currency.currency_name}: {currency.owned}
                            <div className={styles.buttons}>
                                <button className={styles.editButton} onClick={onEditCurrency}>✏️</button>
                                <button className={styles.deleteButton} onClick={() => onDeleteCurrency(currency.currency_id)}>❌</button>
                            </div>
                        </div>
                    ))}

                </div>
            )}
        </div>
    );
};

export default Currencies;