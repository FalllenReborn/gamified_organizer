import React, { useState } from 'react';
import styles from './currency.module.css';

interface CurrenciesProps {
    currencies: any[];
    onCreateNewCurrency: () => void;
}

const Currencies: React.FC<CurrenciesProps> = ({
    onCreateNewCurrency,
    currencies,
}) => {
    const [isHidden, setIsHidden] = useState(false);

    const handleHide = async () => {
        setIsHidden(!isHidden);
    };

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
                    <ul>
                        {currencies.map((currency, index) => (
                        <React.Fragment key={index}>
                            <li>{currency.currency_name}: {currency.owned}</li>
                        </React.Fragment>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Currencies;