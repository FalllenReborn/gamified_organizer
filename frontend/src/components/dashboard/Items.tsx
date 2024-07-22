import React, { useState } from 'react';
import styles from './items.module.css';

interface ItemsProps {
    items: any[];
    onCreateNewItem: () => void;
    onDeleteItem: (id: number) => void;
    onEditItem: () => void;
}

const Items: React.FC<ItemsProps> = ({
    onCreateNewItem,
    onDeleteItem,
    onEditItem,
    items,
}) => {
    const [isHidden, setIsHidden] = useState(false);

    const handleHide = async () => {
        setIsHidden(!isHidden);
    };
    
    const sortedItems = [...items].sort((a, b) => a.item_name.localeCompare(b.item_name));

    return (
        <div className={styles.itemsBase} style={{ 
            width: isHidden ? '40px' : '200px',
            height:  isHidden ? '40px' : '200px',
        }}>
            <div className={styles.taskBar}>
                {!isHidden && 
                    <>
                        <button className={styles.addButton} onClick={onCreateNewItem}>+</button>
                        <div className={styles.title}>Items</div>
                    </>
                }
                <div className={styles.hideButton} onClick={handleHide}>
                    {isHidden ? '▼' : '▲'}
                </div>
            </div>
            {!isHidden && (
                <div className={styles.content}>
                    {sortedItems.map((item, index) => (
                        <div key={index} className={styles.item}>
                            {item.item_name}: {item.storage}
                            <div className={styles.buttons}>
                                <button className={styles.editButton} onClick={onEditItem}>✏️</button>
                                <button className={styles.deleteButton} onClick={() => onDeleteItem(item.item_id)}>❌</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Items;