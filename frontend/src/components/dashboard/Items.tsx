import React, { useState } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import { MdDelete, MdOutlineEdit } from "react-icons/md";
import { LuPackage, LuPackageCheck } from "react-icons/lu";
import styles from './items.module.css';

interface ItemsProps {
    items: any[];
    onCreateNewItem: () => void;
    onDeleteItem: (id: number) => void;
    onEditItem: (itemId: number, itemName: string) => void;
    onUseItem: (itemId: number, storage: number) => void;
}

const Items: React.FC<ItemsProps> = ({
    onCreateNewItem,
    onDeleteItem,
    onEditItem,
    onUseItem,
    items,
}) => {
    const { t } = useTranslation();
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
                        <div className={styles.title}>{t.items}</div>
                    </>
                }
                <div className={styles.hideButton} onClick={handleHide}>
                    {isHidden ? <LuPackage /> : '▲'}
                </div>
            </div>
            {!isHidden && (
                <div className={styles.content}>
                    {sortedItems.map((item, index) => (
                        <div key={index} className={styles.item}>
                            {item.item_name}: {item.storage}
                            <div className={styles.buttons}>
                                <button className={styles.useButton} onClick={() => onUseItem(item.item_id, item.storage)}><LuPackageCheck /></button>
                                <button className={styles.editButton} onClick={() => onEditItem(item.item_id, item.item_name)}><MdOutlineEdit /></button>
                                <button className={styles.deleteButton} onClick={() => onDeleteItem(item.item_id)}><MdDelete /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Items;