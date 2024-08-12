import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import styles from './createPricePopup.module.css';

interface CurrencyData {
    currency_id: number;
    currency_name: string;
    owned: number;
    exchange_rate: number | null;
    exchange_loss: number;
}
  
interface Item {
    item_id: number;
    item_name: string;
    storage: number;
}

interface Price {
    price_id: number;
    currency: number;
    item: number;
    shop: number;
    cost: number;
}

interface Shop {
    shop_id: number;
    shop_name: string;
}

interface CreatePricePopupProps {
    onClose: () => void;
    onConfirm: (
        priceId: number,
        cost: number,
        shopId: number,
        itemId: number,
        currencyId: number,
    ) => void;
    currencies: CurrencyData[];
    items: Item[];
    shopsData: Shop[];
    isEditMode: boolean;
    shopId: number;
    prices: any;
    priceToEdit?: Price;
}

const CreatePricePopup: React.FC<CreatePricePopupProps> = ({
    currencies,
    prices,
    items,
    shopsData,
    shopId,
    isEditMode,
    priceToEdit,
    onClose,
    onConfirm,
  }) => {
    const { t } = useTranslation();
    const [priceCost, setPriceCost] = useState(0);
    const [priceShop, setPriceShop] = useState<number | null>(null);
    const [priceItem, setPriceItem] = useState<number | null>(null);
    const [priceCurrency, setPriceCurrency] = useState<number | null>(null);
    const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
    const [pricesData, setPricesData] = useState<Price[]>()

    useEffect(() => {
        if (isEditMode && priceToEdit) {
            setPriceCost(priceToEdit.cost);
            setPriceItem(priceToEdit.item);
            setPriceCurrency(priceToEdit.currency);
            setPriceShop(priceToEdit.shop);
            setPricesData(prices);
        } else {
            setPriceShop(shopId);
            setPricesData(prices);
        }
    }, [isEditMode, priceToEdit, shopId, prices]);

    const handleItemChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setPriceItem(Number(event.target.value));
    };

    const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setPriceCurrency(Number(event.target.value));
    };

    const handleShopChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setPriceShop(Number(event.target.value));
    };

    const handleCostChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPriceCost(Number(event.target.value));
    };

    const getCurrencyName = (currencyId: number) => {
        const currency = currencies.find(currency => currency.currency_id === currencyId);
        return currency ? currency.currency_name : 'Currency';
    };

    const calculateSuggestion = (existingPrice: Price) => {
        const currencySuggestion = currencies.find(currency => currency.currency_id === existingPrice.currency);
        const currencyPicked = currencies.find(currency => currency.currency_id === priceCurrency);

        if (currencySuggestion && currencyPicked && currencySuggestion.exchange_rate !== null && currencyPicked.exchange_rate !== null) {
            const convertedAmount = existingPrice.cost / (currencyPicked.exchange_rate / currencySuggestion.exchange_rate);
            return parseFloat(convertedAmount.toFixed(2));
        } 
        return "N/A";
    };

    const handleConfirm = () => {
        if (isEditMode && priceToEdit) {
            onConfirm(priceToEdit.price_id, priceCost, priceShop!, priceItem!, priceCurrency!);
        } else {
            onConfirm(0, priceCost, priceShop!, priceItem!, priceCurrency!);
        }
    };

    const isConfirmDisabled = priceItem === null || priceCurrency === null;

    const stopPropagation = (e: React.WheelEvent) => {
        e.stopPropagation();
    };

    return (
        <div className={styles.popupOverlay} onWheel={stopPropagation}>
            <div className={styles.popup} style={{ 
            width: showSuggestions ? '600px' : '300px',
            }}>
                <h2>{isEditMode ? `${t.editPrice}` : `${t.createPrice}`}</h2>
                <div className={styles.columns}>
                    <div className={styles.mainColumn}>
                        <div className={styles.inputGroup}>
                            <label>{t.price}</label>
                            <input
                                type="number"
                                value={priceCost}
                                onChange={handleCostChange}
                                min="0"
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>{t.items}</label>
                            <select value={priceItem ?? ''} onChange={handleItemChange} required>
                                <option value="">{t.selectItem}</option>
                                {items.map((item) => (
                                    <option key={item.item_id} value={item.item_id}>
                                        {item.item_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.inputGroup}>
                            <label>{t.currencies}</label>
                            <select value={priceCurrency ?? ''} onChange={handleCurrencyChange} required>
                                <option value="">{t.selectCurrency}</option>
                                {currencies.map((currency) => (
                                    <option key={currency.currency_id} value={currency.currency_id}>
                                        {currency.currency_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.inputGroup}>
                            <label>{t.shops}</label>
                            <select value={priceShop ?? ''} onChange={handleShopChange}>
                                {shopsData.map((shop) => (
                                    <option key={shop.shop_id} value={shop.shop_id}>
                                        {shop.shop_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.expandSuggestions} onClick={() => setShowSuggestions(!showSuggestions)}>
                            {showSuggestions ? `${t.hideSuggestions} «` : `${t.showSuggestions} »`}
                        </div>
                        <div className={styles.footer}>
                            <button className={styles.cancelButton} onClick={onClose}>
                                {t.cancel}
                            </button>
                            <button
                                className={styles.confirmButton}
                                onClick={handleConfirm}
                                disabled={isConfirmDisabled}
                            >
                                {t.confirm}
                            </button>
                        </div>
                    </div>
                    {showSuggestions && (
                        <div className={styles.suggestionsColumn}>
                            {pricesData  &&
                                pricesData
                                .filter((price) => price.item === priceItem)
                                .map((price) => ( 
                                    <div key={price.price_id}>
                                        ID: {price.price_id} Based on "{getCurrencyName(price.currency)}": {calculateSuggestion(price)}
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreatePricePopup;
