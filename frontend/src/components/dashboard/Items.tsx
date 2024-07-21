import React, { useState } from 'react';
import styles from './items.module.css';

interface ItemsProps {
    items: any[];
    onCreateNewItem: () => void;
}

const Items: React.FC<ItemsProps> = ({
    onCreateNewItem,
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
                    <ul>
                        {sortedItems.map((item, index) => (
                        <React.Fragment key={index}>
                            <li>{item.item_name}: {item.storage}</li>
                        </React.Fragment>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Items;