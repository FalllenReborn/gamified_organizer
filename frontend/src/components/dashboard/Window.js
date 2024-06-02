import React, { useState, useEffect } from 'react';
import styles from './window.module.css';

const Window = ({ id, title, onClose, onRename, translate, scale, onClick, zIndex, initialX, initialY }) => {
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
      const mouseX = e.clientX / scale;
      const mouseY = e.clientY / scale;
      console.log('Mouse X:', mouseX);
      console.log('Mouse Y:', mouseY);
      
      const newX = mouseX - startPos.x;
      const newY = mouseY - startPos.y;
      console.log('New X:', newX);
      console.log('New Y:', newY);
      
      setPosition({ x: newX, y: newY });
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

  const handleRename = () => {
    onRename(id);
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
      onMouseDown={handleMouseDown}
    >
      <div className={styles.taskbar}>
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
    </div>
  );
};

export default Window;
