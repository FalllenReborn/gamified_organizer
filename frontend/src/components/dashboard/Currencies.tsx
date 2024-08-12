import React, { useState } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import { MdCurrencyExchange, MdDelete, MdOutlineEdit  } from "react-icons/md";
import { GrMoney } from "react-icons/gr";
import styles from './currencies.module.css';

interface CurrenciesProps {
    currencies: any[];
    onCreateNewCurrency: () => void;
    onDeleteCurrency: (id: number) => void;
    onEditCurrency: (currencyId: number, currencyName: string, exchangeRate: number | null, exchangeLoss: number) => void;
    onExchangeCurrency: (id: number) => void;
}

const Currencies: React.FC<CurrenciesProps> = ({
    onExchangeCurrency,
    onCreateNewCurrency,
    onDeleteCurrency,
    onEditCurrency,
    currencies,
}) => {
    const { t } = useTranslation();
    const [isHidden, setIsHidden] = useState(false);

    const handleHide = () => {
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
                        <div className={styles.title}>{t.currencies}</div>
                    </>
                }
                <div className={styles.hideButton} onClick={handleHide}>
                    {isHidden ? <GrMoney /> : '▲'}
                </div>
            </div>
            {!isHidden && (
                <div className={styles.content}>
                    {sortedCurrencies.map((currency, index) => (
                        <div key={index} className={styles.currency}>
                            {currency.currency_name}: {currency.owned}
                            <div className={styles.buttons}>
                                {currency.exchange_rate != null &&  (
                                    <button className={styles.exchangeButton} onClick={() => onExchangeCurrency(currency.currency_id)}><MdCurrencyExchange /></button>
                                )}
                                <button 
                                    className={styles.editButton} 
                                    onClick={() => onEditCurrency(currency.currency_id, currency.currency_name, currency.exchange_rate, currency.exchange_loss)}
                                >
                                    <MdOutlineEdit />
                                </button>
                                <button className={styles.deleteButton} onClick={() => onDeleteCurrency(currency.currency_id)}><MdDelete /></button>
                            </div>
                        </div>
                    ))}

                </div>
            )}
        </div>
    );
};

export default Currencies;