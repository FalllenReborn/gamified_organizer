import React, { useState, useEffect } from 'react';
import styles from './window.module.css';

const Window = ({ id, onClose, translate, scale, onClick, zIndex, initialX, initialY }) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX / scale - position.x,
      y: e.clientY / scale - position.y,
    });
    onClick();
    document.body.classList.add('disable-select'); // Apply disable-select class to prevent text selection
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: (e.clientX / scale - startPos.x),
        y: (e.clientY / scale - startPos.y),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.classList.remove('disable-select'); // Remove disable-select class when dragging ends
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleHide = () => {
    // Placeholder function for "Hide"
    console.log(`Hide window ${id}`);
    setIsDropdownOpen(false);
  };

  const handleDelete = () => {
    // Placeholder function for "Delete"
    console.log(`Delete window ${id}`);
    onClose(id);
    setIsDropdownOpen(false);
  };

  return (
    <div
      className={`${styles.window} ${isDragging ? styles.dragging : ''}`}
      style={{
        top: `${position.y * scale}px`,
        left: `${position.x * scale}px`,
        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
        transformOrigin: 'top left',
        zIndex: zIndex + 500 // Add a base zIndex to keep windows above other components
      }}
    >
      <div className={styles.taskbar} onMouseDown={handleMouseDown}>
        <span className={styles.title} style={{ userSelect: 'none' }}>Window {id}</span>
        <div className={styles.dropdownContainer}>
          <button className={styles.dropdownButton} onClick={toggleDropdown}>
            ↓
          </button>
          {isDropdownOpen && (
            <div className={styles.dropdownMenu}>
              <button onClick={handleHide}>Hide</button>
              <button onClick={handleDelete}>Delete</button>
            </div>
          )}
        </div>
      </div>
      <div className={styles.content}>
        {/* Window content here */}
      </div>
    </div>
  );
};

export default Window;
