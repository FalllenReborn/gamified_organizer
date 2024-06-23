import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './bar.module.css';
import axios from 'axios';

interface BarProps {
    id: number;
    title: string;
    total_points: number;
    full_cycle: number;
    xp_name: string;
    onClose: (id: number) => void;
    onRename: (id: number) => void;
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
    onClose,
    onRename,
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
    const barRef = useRef<HTMLDivElement>(null);
    const positionRef = useRef(position);
    const sizeRef = useRef(size);

    const updateSizeInDatabase = useCallback(async (width: number, height: number) => {
        try {
            const response = await axios.put(`http://localhost:8000/api/bars/${id}/update_bar/`, { size_horizontal: width, size_vertical: height });
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

    useEffect(() => {
        positionRef.current = position;
        sizeRef.current = size;
    }, [position, size]);

    const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        setIsDragging(true);
        setStartPos({
            x: e.clientX / scale - position.x,
            y: e.clientY / scale - position.y,
        });
        onClick();
        document.body.classList.add('disable-select');
    }, [position, scale, onClick]);

    const handleDragMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            const mouseX = e.clientX / scale;
            const mouseY = e.clientY / scale;
            setPosition({ x: mouseX - startPos.x, y: mouseY - startPos.y });
        }
    }, [isDragging, scale, startPos]);

    const handleDragEnd = useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            document.body.classList.remove('disable-select');
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
        document.body.classList.add('disable-select');
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (isResizing) {
            const dx = (e.clientX / scale - startPos.x);
            const dy = (e.clientY / scale - startPos.y);

            let newWidth = size.width;
            let newHeight = size.height;
            let newX = position.x;
            let newY = position.y;

            if (resizeDirection.includes('right')) newWidth += dx;
            if (resizeDirection.includes('bottom')) newHeight += dy;
            if (resizeDirection.includes('left')) {
                newWidth -= dx;
                newX += dx;
            }
            if (resizeDirection.includes('top')) {
                newHeight -= dy;
                newY += dy;
            }

            setSize({ width: newWidth, height: newHeight });
            setPosition({ x: newX, y: newY });
            setStartPos({
                x: e.clientX / scale,
                y: e.clientY / scale,
            });
        }
    };

    const handleResizeEnd = () => {
        if (isResizing) {
            setIsResizing(false);
            document.body.classList.remove('disable-select');
            const updatedSize = sizeRef.current;
            updateSizeInDatabase(updatedSize.width, updatedSize.height);
            updatePositionInDatabase(positionRef.current.x, positionRef.current.y);
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
        console.log(`Delete bar ${id}`);
        onClose(id);
        setDropdownOpen(false);
    };

    const handleRename = () => {
        onRename(id);
        setDropdownOpen(false);
    };

    const progressPercentage = (total_points % full_cycle) / full_cycle * 100;

    return (
        <div
            id={`bar-${id}`}
            ref={barRef}
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
                ref={barRef}
                className={styles.bar}
                onMouseDown={handleDragStart}
                style={{
                    width: `${size.width}px`,
                    height: `${size.height}px`,
            }}>
                <div className={styles.topLine}>
                    
                    <div className={styles.dropdown}>
                        <button onClick={() => setDropdownOpen(!dropdownOpen)}>Menu</button>
                        {dropdownOpen && (
                            <div className={styles.dropdownContent}>
                                <button onClick={handleDelete}>Delete</button>
                                <button onClick={handleRename}>Rename</button>
                            </div>
                        )}
                    </div>
                    <span className={styles.id}>ID: {id}</span>
                </div>
                <div className={styles.content}>
                    <span className={styles.title}>{title}</span>
                    <div className={styles.progressHeader}>Progress bar:</div>
                    <div className={styles.progressContainer}>
                        <div className={styles.progressBar} style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <div className={styles.progressDescription}>
                        <div className={styles.progressText}>
                            {total_points % full_cycle}/{full_cycle} ({progressPercentage.toFixed(2)}%)
                        </div>
                        <p className={styles.xpName}>{xp_name}</p>
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
