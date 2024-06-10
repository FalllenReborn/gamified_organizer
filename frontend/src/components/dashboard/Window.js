import React, { useState, useEffect, useRef } from 'react';
import styles from './window.module.css';
import axios from 'axios';

const Window = ({ id, title, onClose, onRename, translate, scale, onClick, zIndex, initialX, initialY, initialWidth, initialHeight, onResize }) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const windowRef = useRef(null);

  const positionRef = useRef(position);
  const sizeRef = useRef(size);

  useEffect(() => {
    positionRef.current = position;
    sizeRef.current = size;
  }, [position, size]);

  const handleDragStart = (e) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX / scale - position.x,
      y: e.clientY / scale - position.y,
    });
    onClick();
    document.body.classList.add('disable-select');
  };

  const handleDragMove = (e) => {
    if (isDragging) {
      const mouseX = e.clientX / scale;
      const mouseY = e.clientY / scale;
      setPosition({ x: mouseX - startPos.x, y: mouseY - startPos.y });
    }
  };

  const handleDragEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      document.body.classList.remove('disable-select');
      updatePositionInDatabase(positionRef.current.x, positionRef.current.y);
    }
  };

  const handleResizeStart = (e, direction) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setStartPos({
      x: e.clientX / scale,
      y: e.clientY / scale,
    });
    document.body.classList.add('disable-select');
  };

  const handleResizeMove = (e) => {
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
      setSize((prevSize) => {
        const updatedSize = { ...prevSize };
        updateSizeInDatabase(updatedSize.width, updatedSize.height);
        updatePositionInDatabase(positionRef.current.x, positionRef.current.y); // Update position after resizing
        onResize(id, updatedSize.width, updatedSize.height);
        return updatedSize;
      });
    }
  };

  const updateSizeInDatabase = async (width, height) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/tasklists/${id}/update_lists/`, { size_horizontal: width, size_vertical: height });
      console.log('Size updated successfully:', response.data);
    } catch (error) {
      console.error('Error updating size:', error);
    }
  };

  const updatePositionInDatabase = async (x, y) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/tasklists/${id}/update_lists/`, { x_axis: x, y_axis: y });
      console.log('Position updated successfully:', response.data);
    } catch (error) {
      console.error('Error updating position:', error);
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
  }, [isDragging]);

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
  }, [isResizing]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleHide = () => {
    console.log(`Hide window ${id}`);
    setIsDropdownOpen(false);
  };

  const handleDelete = async () => {
    console.log(`Delete window ${id}`);
    // await deleteWindowFromDatabase(id); // Uncomment if needed in the future
    onClose(id); // Close the window after deletion
    setIsDropdownOpen(false);
  };

  const handleRename = () => {
    onRename(id);
    setIsDropdownOpen(false);
  };

  return (
    <div
      id={`window-${id}`}
      ref={windowRef}
      className={`${styles.window} ${isDragging ? styles.dragging : ''}`}
      style={{
        top: `${position.y * scale}px`,
        left: `${position.x * scale}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
        transformOrigin: 'top left',
        zIndex: zIndex
      }}
    >
      <div
        className={styles.taskbar}
        onMouseDown={handleDragStart}
      >
        <span className={styles.title}>{title}</span>
        <div className={styles.bottomBar}>
          <span className={styles.id}>ID: {id}</span>
          <div className={styles.dropdownContainer}>
            <button className={styles.dropdownButton} onClick={toggleDropdown}>
              ↓
            </button>
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                <button onClick={handleHide}>Hide</button>
                <button onClick={handleDelete}>Delete</button>
                <button onClick={handleRename}>Rename</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.content}>
        {/* Window content here */}
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

export default Window;
