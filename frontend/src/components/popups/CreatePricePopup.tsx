import React, { useState, useEffect } from 'react';
import styles from './createPricePopup.module.css';

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
    currencies: Currency[];
    items: Item[];
    shopsData: Shop[];
    isEditMode: boolean;
    shopId: number;
    priceToEdit?: Price;
}

const CreatePricePopup: React.FC<CreatePricePopupProps> = ({
    currencies,
    items,
    shopsData,
    shopId,
    isEditMode,
    priceToEdit,
    onClose,
    onConfirm,
  }) => {
    const [priceCost, setPriceCost] = useState(0);
    const [priceShop, setPriceShop] = useState<number | null>(null);
    const [priceItem, setPriceItem] = useState<number | null>(null);
    const [priceCurrency, setPriceCurrency] = useState<number | null>(null);

    useEffect(() => {
        if (isEditMode && priceToEdit) {
            setPriceCost(priceToEdit.cost);
            setPriceItem(priceToEdit.item);
            setPriceCurrency(priceToEdit.currency);
            setPriceShop(priceToEdit.shop);
        } else {
            setPriceShop(shopId);
        }
    }, [isEditMode, priceToEdit, shopId]);

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
            <div className={styles.popup}>
                <h2>{isEditMode ? 'Edit Price' : 'Create Price'}</h2>
                <div className={styles.inputGroup}>
                    <label>Cost</label>
                    <input
                        type="number"
                        value={priceCost}
                        onChange={handleCostChange}
                        min="0"
                        required
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label>Items</label>
                    <select value={priceItem ?? ''} onChange={handleItemChange} required>
                        <option value="">Select an item</option>
                        {items.map((item) => (
                            <option key={item.item_id} value={item.item_id}>
                                {item.item_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.inputGroup}>
                    <label>Currencies</label>
                    <select value={priceCurrency ?? ''} onChange={handleCurrencyChange} required>
                        <option value="">Select a currency</option>
                        {currencies.map((currency) => (
                            <option key={currency.currency_id} value={currency.currency_id}>
                                {currency.currency_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.inputGroup}>
                    <label>Shops</label>
                    <select value={priceShop ?? ''} onChange={handleShopChange}>
                        {shopsData.map((shop) => (
                            <option key={shop.shop_id} value={shop.shop_id}>
                                {shop.shop_name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.footer}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className={styles.confirmButton}
                        onClick={handleConfirm}
                        disabled={isConfirmDisabled}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePricePopup;
