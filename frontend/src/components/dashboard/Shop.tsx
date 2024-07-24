import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './shop.module.css';
import axios from 'axios';

interface ShopProps {
    id: number;
    title: string;
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
    currencies: any[];
    items: any[];
    prices: any[]
}

const Shop: React.FC<ShopProps> = ({
    id,
    title,
    initialX,
    initialY,
    initialWidth,
    initialHeight,
    translate,
    scale,
    zIndex,
    currencies,
    items,
    prices,
    onClose,
    onEdit,
    onClick,
    onDrag,
    onResize,
    onPositionUpdate,
    onSizeUpdate,
}) => {
    const [position, setPosition] = useState({ x: initialX, y: initialY });
    const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState('');
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const shopRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
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
            const response = await axios.put(`http://localhost:8000/api/shops/${id}/update_shop/`, { size_horizontal: constrainedWidth, size_vertical: constrainedHeight });
            console.log('Size updated successfully:', response.data);
        } catch (error) {
            console.error('Error updating size:', error);
        }
    }, [id]);

    const updatePositionInDatabase = useCallback(async (x: number, y: number) => {
        try {
            const response = await axios.put(`http://localhost:8000/api/shops/${id}/update_shop/`, { x_axis: x, y_axis: y });
            console.log('Position updated successfully:', response.data);
        } catch (error) {
            console.error('Error updating position:', error);
        }
    }, [id]);

    useEffect(() => {  // works only when clicking on dashboard
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                shopRef.current &&
                !shopRef.current.contains(event.target as Node)
            ) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

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

    const handleResizeMove = (e: MouseEvent) => {
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
    };

    const handleResizeEnd = () => {
        if (isResizing) {
            setIsResizing(false);
            document.body.classList.remove(styles.disableSelect);
            const updatedSize = sizeRef.current;
            const updatedPosition = positionRef.current;
            updateSizeInDatabase(updatedSize.width, updatedSize.height);
            updatePositionInDatabase(updatedPosition.x, updatedPosition.y);
            onResize(id, updatedSize.width, updatedSize.height, 'bars');
        }
    };

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
        console.log(`Delete shop ${id}`);
        onClose(id);
        setDropdownOpen(false);
    };

    const handleEdit = () => {
        onEdit(id);
        setDropdownOpen(false);
    };

    const getPricesForShop = (shopId: number) => {
        return prices.filter((price) => price.bar === shopId);
    };

    const getCurrencyName = (currencyId: number) => {
        const currency = currencies.find(currency => currency.currency_id === currencyId);
        return currency ? currency.currency_name : 'Currency';
    };

    return (
        <div
            id={`shop-${id}`}
            ref={shopRef}
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
                id={`shop-${id}`}
                ref={shopRef}
                className={styles.shop}
                onMouseDown={handleDragStart}
                style={{
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                }}>
                <div className={styles.topLine}>
                    <div className={styles.dropdown} ref={dropdownRef}>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setDropdownOpen(!dropdownOpen);
                            }}
                            draggable={false}
                            className={styles.dropdownButton}
                        >
                            Menu
                        </button>
                        {dropdownOpen && (
                            <div className={styles.dropdownContent}>
                                <button onClick={handleDelete}>Delete</button>
                                <button onClick={handleEdit}>Edit</button>
                            </div>
                        )}
                    </div>
                    <span className={styles.id}>ID: {id}</span>
                </div>
                <div className={styles.content}>
                    <span className={styles.title}>{title}</span>
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

export default Shop;