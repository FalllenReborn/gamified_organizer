import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import { MdDelete, MdOutlineEdit } from "react-icons/md";
import { BiSolidHide } from "react-icons/bi";
import { MdKeyboardDoubleArrowDown } from "react-icons/md";
import styles from './bar.module.css';
import axios from 'axios';

interface BarProps {
    id: number;
    title: string;
    total_points: number;
    full_cycle: number;
    xp_name: string;
    onClose: (id: number) => void;
    onEdit: (id: number) => void;
    onDrag: (id: number, x: number, y: number, type: string) => void;
    translate: { x: number; y: number };
    scale: number;
    onClick: () => void;
    zIndex: number;
    initialX: number;
    initialY: number;
    initialWidth: number;
    initialHeight: number;
    onResize: (id: number, width: number, height: number, type: string) => void;
    onPositionUpdate: (id: number, x: number, y: number) => void;
    onSizeUpdate: (id: number, width: number, height: number) => void;
    transactions: any[];
    currencies: any[];
    items: any[];
    vouchers: any[];
}

const Bar: React.FC<BarProps> = ({
    id,
    title,
    total_points,
    full_cycle,
    xp_name,
    initialX,
    initialY,
    initialWidth,
    initialHeight,
    translate,
    scale,
    zIndex,
    transactions,
    vouchers,
    currencies,
    items,
    onClose,
    onEdit,
    onClick,
    onDrag,
    onResize,
    onPositionUpdate,
    onSizeUpdate,
}) => {
    const { t } = useTranslation();
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState('');
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [expandedBar, setExpandedBar] = useState(false)
    const positionRef = useRef(position);
    const sizeRef = useRef(size);

    useEffect(() => {
        setPosition({ x: initialX, y: initialY });
        positionRef.current = { x: initialX, y: initialY };
    }, [initialX, initialY]);

    useEffect(() => {
        setSize({ width: initialWidth, height: initialHeight });
        sizeRef.current = { width: initialWidth, height: initialHeight };
    }, [initialWidth, initialHeight]);

    const updateSizeInDatabase = useCallback(async (width: number, height: number) => {
        const constrainedWidth = width < 50 ? 50 : width;
        const constrainedHeight = height < 50 ? 50 : height;

        try {
            const response = await axios.put(`http://localhost:8000/api/bars/${id}/update_bar/`, { size_horizontal: constrainedWidth, size_vertical: constrainedHeight });
            console.log('Size updated successfully:', response.data);
        } catch (error) {
            console.error('Error updating size:', error);
        }
    }, [id]);

    const updatePositionInDatabase = useCallback(async (x: number, y: number) => {
        try {
            const response = await axios.put(`http://localhost:8000/api/bars/${id}/update_bar/`, { x_axis: x, y_axis: y });
            console.log('Position updated successfully:', response.data);
        } catch (error) {
            console.error('Error updating position:', error);
        }
    }, [id]);

    const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if ((e.target as HTMLElement).closest(`.${styles.dropdown}`)) return;
        setIsDragging(true);
        setStartPos({
            x: e.clientX / scale - position.x,
            y: e.clientY / scale - position.y,
        });
        onClick();
        document.body.classList.add(styles.disableSelect);
    }, [position, scale, onClick]);

    const handleDragMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            const mouseX = e.clientX / scale;
            const mouseY = e.clientY / scale;
            const newPosition = { x: mouseX - startPos.x, y: mouseY - startPos.y };
            setPosition(newPosition);
            positionRef.current = newPosition;
        }
    }, [isDragging, scale, startPos]);

    const handleDragEnd = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            document.body.classList.remove(styles.disableSelect);
            updatePositionInDatabase(positionRef.current.x, positionRef.current.y);
        }
    }, [isDragging, updatePositionInDatabase]);

    const handleResizeStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, direction: string) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeDirection(direction);
        setStartPos({
            x: e.clientX / scale,
            y: e.clientY / scale,
        });
        document.body.classList.add(styles.disableSelect);
    };

    const handleResizeMove = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const dx = e.clientX / scale - startPos.x;
            const dy = e.clientY / scale - startPos.y;

            let newWidth = size.width;
            let newHeight = size.height;
            let newX = position.x;
            let newY = position.y;

            if (resizeDirection.includes('right')) newWidth += dx;
            if (resizeDirection.includes('bottom')) newHeight += dy;
            if (resizeDirection.includes('left')) {
                if (newWidth - dx >= 50) {
                    newWidth -= dx;
                    newX += dx;
                } else {
                    newX += newWidth - 50;
                    newWidth = 50;
                }
            }
            if (resizeDirection.includes('top')) {
                if (newHeight - dy >= 50) {
                    newHeight -= dy;
                    newY += dy;
                } else {
                    newY += newHeight - 50;
                    newHeight = 50;
                }
            }
          
            // Apply the constraints
            newWidth = Math.max(newWidth, 50);
            newHeight = Math.max(newHeight, 50);

            const newSize = { width: newWidth, height: newHeight };
            const newPosition = { x: newX, y: newY };
            setSize(newSize);
            setPosition(newPosition);
            sizeRef.current = newSize;
            positionRef.current = newPosition;
            setStartPos({
                x: e.clientX / scale,
                y: e.clientY / scale,
            });
        }
    }, [isResizing, scale, startPos, size.width, size.height, position.x, position.y, resizeDirection]);

    const handleResizeEnd = useCallback(() => {
        if (isResizing) {
            setIsResizing(false);
            document.body.classList.remove(styles.disableSelect);
            const updatedSize = sizeRef.current;
            const updatedPosition = positionRef.current;
            updateSizeInDatabase(updatedSize.width, updatedSize.height);
            updatePositionInDatabase(updatedPosition.x, updatedPosition.y);
            onResize(id, updatedSize.width, updatedSize.height, 'bars');
        }
    }, [isResizing, updateSizeInDatabase, updatePositionInDatabase, id, onResize]);

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
        } else {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
        }
        return () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeEnd);
        } else {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
        }
        return () => {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
        };
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    const handleDelete = async () => {
        console.log(`Delete bar ${id}`);
        onClose(id);
    };

    const handleEdit = () => {
        onEdit(id);
    };

    const getTransactionsForBar = (barId: number) => {
        return transactions.filter((transaction) => transaction.bar === barId);
    };

    const getVouchersForBar = (barId: number) => {
        return vouchers.filter((voucher) => voucher.bar === barId);
    };

    const getCurrencyName = (currencyId: number) => {
        const currency = currencies.find(currency => currency.currency_id === currencyId);
        return currency ? currency.currency_name : 'Currency';
    };

    const getItemName = (itemId: number) => {
        const item = items.find(item => item.item_id === itemId);
        return item ? item.item_name : 'Item';
    };

    const progressPercentage = (total_points % full_cycle) / full_cycle * 100;

    return (
        <div
            id={`bar-${id}`}
            className={`${styles.outerWrapper} ${isDragging ? styles.dragging : ''}`}
            style={{
                top: `${position.y * scale}px`,
                left: `${position.x * scale}px`,
                width: `${size.width + 20}px`,
                height: `${size.height + 20}px`,
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                transformOrigin: 'top left',
                zIndex: zIndex
            }}
        >
            <div
                id={`bar-${id}`}
                className={styles.bar}
                onMouseDown={handleDragStart}
                style={{
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                }}>
                <div className={styles.topLine}>
                    <div className={styles.dropdown}>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleEdit();
                            }}
                            className={styles.taskButton}
                        >
                            <MdOutlineEdit />
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            className={styles.taskButton}
                        >
                            <BiSolidHide />
                        </button>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDelete();
                            }}
                            className={styles.taskButton}
                        >
                            <MdDelete />
                        </button>
                    </div>
                    <span className={styles.id}>ID: {id}</span>
                </div>
                <div className={styles.content}>
                    <span className={styles.title}>{title}</span>
                    <div className={styles.progressTop}>
                        <div className={styles.progressHeader}>{t.progressBar}:</div>
                        <div className={styles.lvl}>{t.level}: {Math.floor(total_points / full_cycle)}</div>
                    </div>
                    <div className={styles.progressContainer}>
                        <div className={styles.progressBar} style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <div className={styles.progressDescription}>
                        <div className={styles.xpLine}>
                            <div className={styles.progressText}>
                                {total_points % full_cycle}/{full_cycle} ({progressPercentage.toFixed(2)}%)
                            </div>
                            <p className={styles.xpName}>{xp_name}</p>
                        </div>
                        <div className={styles.buttonLine}>
                            <button className={styles.expandButton} onClick={() => setExpandedBar(!expandedBar)}>
                                <MdKeyboardDoubleArrowDown />
                            </button>
                        </div>
                        <div className={styles.completionLine}>
                            {expandedBar && (
                                <div className={styles.completion}>
                                    {t.completion}:
                                    <ul className={styles.transactions}> 
                                        {getTransactionsForBar(id).map((transaction) => (
                                            <li key={transaction.transaction_id} className={styles.transaction}>
                                                {getCurrencyName(transaction.currency)}: {transaction.amount}<br />
                                            </li>
                                        ))}
                                        {getVouchersForBar(id).map((voucher) => (
                                            <li key={voucher.voucher_id} className={styles.voucher}>
                                                {getItemName(voucher.item)}: {voucher.quantity}<br />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className={`${styles.resizeHandle} ${styles.right}`} onMouseDown={(e) => handleResizeStart(e, 'right')}></div>
            <div className={`${styles.resizeHandle} ${styles.bottom}`} onMouseDown={(e) => handleResizeStart(e, 'bottom')}></div>
            <div className={`${styles.resizeHandle} ${styles.left}`} onMouseDown={(e) => handleResizeStart(e, 'left')}></div>
            <div className={`${styles.resizeHandle} ${styles.top}`} onMouseDown={(e) => handleResizeStart(e, 'top')}></div>
            <div className={`${styles.resizeHandle} ${styles.topLeft}`} onMouseDown={(e) => handleResizeStart(e, 'top-left')}></div>
            <div className={`${styles.resizeHandle} ${styles.topRight}`} onMouseDown={(e) => handleResizeStart(e, 'top-right')}></div>
            <div className={`${styles.resizeHandle} ${styles.bottomLeft}`} onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}></div>
            <div className={`${styles.resizeHandle} ${styles.bottomRight}`} onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}></div>
        </div>
    );
};

export default Bar;
