import React, { useState } from 'react';
import styles from './window.module.css';

const Window = ({ id, className, onClose, translate }) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.classList.contains(styles.taskbar)) {
      setIsDragging(true);
      setStartPos({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
      document.body.classList.add('disable-select'); // Apply disable-select class to prevent text selection
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    document.body.classList.remove('disable-select'); // Remove disable-select class when dragging ends
  };

  return (
    <div
      className={`${styles.window} ${isDragging ? styles.dragging : ''}`}
      style={{ transform: `translate(${position.x}px, ${position.y}px) translate(${translate.x}px, ${translate.y}px)` }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className={styles.taskbar} onMouseDown={handleMouseDown}>
        <span className={styles.title}>Window {id}</span>
        <button className={styles.closeButton} onClick={() => onClose(id)}>X</button>
      </div>
      <div className={styles.content}>
        {/* Window content here */}
      </div>
    </div>
  );
};

export default Window;
