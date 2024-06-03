import React, { useState, useEffect } from 'react';
import styles from './window.module.css';
import axios from 'axios';

const Window = ({ id, title, onClose, onRename, translate, scale, onClick, zIndex, initialX, initialY, initialWidth, initialHeight }) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
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

      const newX = mouseX - startPos.x;
      const newY = mouseY - startPos.y;

      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = (e) => {
    setIsDragging(false);
    document.body.classList.remove('disable-select'); // Remove disable-select class when dragging ends

    // Capture the final position on mouse up
    const mouseX = e.clientX / scale;
    const mouseY = e.clientY / scale;
    const newX = mouseX - startPos.x;
    const newY = mouseY - startPos.y;

    // Update the position state to the final values
    setPosition({ x: newX, y: newY });

    // Update the database with the final position
    updatePositionInDatabase(newX, newY);
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

  // Function to update position in the database
  const updatePositionInDatabase = async (x, y) => {
    console.log(`Updating position in the database for window ${id} to (${x}, ${y})`);
  
    // Example using localStorage
    const windows = JSON.parse(localStorage.getItem('windows')) || {};
    windows[id] = { x, y };
    localStorage.setItem('windows', JSON.stringify(windows));
  
    // Example API call:
    try {
      const response = await axios.put(`http://localhost:8000/api/tasklists/${id}/update_position/`, { x_axis: x, y_axis: y });
      console.log('Position updated successfully:', response.data);
      if (response.data.x_axis !== x || response.data.y_axis !== y) {
        console.error(`API did not update the position correctly. Expected (${x}, ${y}) but got (${response.data.x_axis}, ${response.data.y_axis})`);
      }
    } catch (error) {
      console.error('Error updating position:', error);
    }
  };

  return (
    <div
      className={`${styles.window} ${isDragging ? styles.dragging : ''}`}
      style={{
        top: `${position.y * scale}px`,
        left: `${position.x * scale}px`,
        width: `${size.width * scale}px`,
        height: `${size.height * scale}px`,
        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
        transformOrigin: 'top left',
        zIndex: zIndex + 500 // Add a base zIndex to keep windows above other components
      }}
    >
      <div className={styles.taskbar} onMouseDown={handleMouseDown}>
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
