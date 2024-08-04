import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import styles from './exchangePopup.module.css';

interface Currency {
    currency_id: number;
    currency_name: string;
    owned: number;
    exchange_rate: number | null;
    exchange_loss: number;
}

interface ExchangePopupProps {
    show: boolean;
    fromCurrencyId: number;
    currencies: Currency[];
    onClose: () => void;
    onConfirm: (fromCurrencyId: number, toCurrencyId: number, amount: number) => void;
}

const ExchangePopup: React.FC<ExchangePopupProps> = ({ fromCurrencyId, currencies, onClose, onConfirm, show }) => {
    const { t } = useTranslation();
    const [fromCurrency, setFromCurrency] = useState<Currency | null>(null);
    const [toCurrency, setToCurrency] = useState<Currency | null>(null);
    const [fromAmount, setFromAmount] = useState<number>(0);
    const [toAmount, setToAmount] = useState<number>(0);

    useEffect(() => {
        if (show) {
            const selectedCurrency = currencies.find(currency => currency.currency_id === fromCurrencyId);
            setFromCurrency(selectedCurrency || null);
        }
    }, [fromCurrencyId, currencies, show]);

    const handleFromCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const currency = currencies.find(currency => currency.currency_id === parseInt(event.target.value));
        setFromCurrency(currency || null);

        console.log(fromCurrency?.currency_name);

        if (currency && toCurrency) {
            const convertedAmount = fromAmount * (currency.exchange_rate! / toCurrency.exchange_rate!) * (1 - toCurrency.exchange_loss);
            setToAmount(parseFloat(convertedAmount.toFixed(2)));
        }
    };

    const handleToCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const currency = currencies.find(currency => currency.currency_id === parseInt(event.target.value));
        setToCurrency(currency || null);

        if (fromCurrency && currency) {
            const convertedAmount = toAmount / (1 - currency.exchange_loss) / (fromCurrency.exchange_rate! / currency.exchange_rate!);
            setFromAmount(parseFloat(convertedAmount.toFixed(2)));
        }
    };

    const handleFromAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const amount = parseFloat(event.target.value);
        setFromAmount(amount);
        if (fromCurrency && toCurrency) {
            const convertedAmount = amount * (fromCurrency.exchange_rate! / toCurrency.exchange_rate!) * (1 - toCurrency.exchange_loss);
            setToAmount(parseFloat(convertedAmount.toFixed(2)));
        }
    };

    const handleToAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const amount = parseFloat(event.target.value);
        setToAmount(amount);
        if (fromCurrency && toCurrency) {
            const convertedAmount = amount / (1 - toCurrency.exchange_loss) / (fromCurrency.exchange_rate! / toCurrency.exchange_rate!);
            setFromAmount(parseFloat(convertedAmount.toFixed(2)));
        }
    };

    const handleConfirm = () => {
        if (fromCurrency && toCurrency && fromAmount > 0 && toAmount > 0) {
            onConfirm(fromCurrency.currency_id, toCurrency.currency_id, fromAmount);
            setFromAmount(0);
            setToAmount(0);
            setFromCurrency(null);
            setToCurrency(null);
        }
    };

    const handleClose = () => {
        onClose();
        setFromAmount(0);
        setToAmount(0);
        setFromCurrency(null);
        setToCurrency(null);
    }

    const stopPropagation = (e: React.WheelEvent) => {
        e.stopPropagation();
      };

    const isConfirmDisabled = fromCurrency ? fromAmount > fromCurrency.owned : false;

    if (!show) {
        return null;
    }

    return (
        <div className={styles.popupContainer} onWheel={stopPropagation}>
            <div className={styles.popup}>
                <div className={styles.header}>{t.exchangeCurrencies}</div>
                <div className={styles.columns}>
                    <div className={styles.column}>
                        <div className={styles.columnTitle}>{t.fromCurrency}</div>
                        <select className={styles.dropdown} value={fromCurrency?.currency_id || ''} onChange={handleFromCurrencyChange}>
                            {currencies.filter(currency => currency.exchange_rate !== null && currency.currency_id !== toCurrency?.currency_id).map(currency => (
                                <option key={currency.currency_id} value={currency.currency_id}>
                                    {currency.currency_name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            className={styles.input}
                            value={fromAmount}
                            onChange={handleFromAmountChange}
                            placeholder="Amount"
                        />
                        <div className={styles.description}>
                            <div className={styles.descriptionName}>Name:</div> <div className={styles.descriptionValue}>{fromCurrency?.currency_name}<br /></div>
                            <div className={styles.descriptionName}>Owned:</div> <div className={styles.descriptionValue}>{fromCurrency?.owned}<br /></div>
                            <div className={styles.descriptionName}>Rate:</div> <div className={styles.descriptionValue}>{fromCurrency?.exchange_rate}<br /></div>
                        </div>
                    </div>
                    <div className={styles.column}>
                        <div className={styles.columnTitle}>{t.toCurrency}</div>
                        <select className={styles.dropdown} value={toCurrency?.currency_id || ''} onChange={handleToCurrencyChange}>
                            <option value="" disabled>
                                {t.selectCurrency}
                            </option>
                            {currencies.filter(currency => currency.exchange_rate !== null && currency.currency_id !== fromCurrency?.currency_id).map(currency => (
                                <option key={currency.currency_id} value={currency.currency_id}>
                                    {currency.currency_name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="number"
                            className={styles.input}
                            value={toAmount}
                            onChange={handleToAmountChange}
                            placeholder="Amount"
                        />
                        <div className={styles.description}>
                            <div className={styles.descriptionName}>Name:</div> <div className={styles.descriptionValue}>{toCurrency?.currency_name}<br /></div>
                            <div className={styles.descriptionName}>Owned:</div> <div className={styles.descriptionValue}>{toCurrency?.owned}<br /></div>
                            <div className={styles.descriptionName}>Rate:</div> <div className={styles.descriptionValue}>{toCurrency?.exchange_rate}<br /></div>
                            <div className={styles.descriptionName}>Loss:</div> <div className={styles.descriptionValue}>{toCurrency?.exchange_loss !== undefined ? (toCurrency?.exchange_loss * 100).toFixed(2) + '%' : 'N/A'}<br /></div>
                        </div>
                    </div>
                </div>
                <div className={styles.equation}>
                    {fromAmount} * ({fromCurrency?.exchange_rate!} / {toCurrency?.exchange_rate!}) * (1 - {toCurrency?.exchange_loss}) = {toAmount}
                </div>
                <div className={styles.buttons}>
                    
                    <button className={styles.cancelButton} onClick={handleClose}>{t.cancel}</button>
                    {isConfirmDisabled && <div className={styles.errorText}>{t.notEnoughCurrency}</div>}
                    <button
                        className={styles.confirmButton}
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                    >
                        {t.confirm}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExchangePopup;
