import React, { useState, useEffect, useRef } from 'react';
import styles from './window.module.css';
import axios from 'axios';

const Window = ({ id, title, onClose, onRename, translate, scale, onClick, zIndex, initialX, initialY, initialWidth, initialHeight, onResize }) => {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const windowRef = useRef(null);

  useEffect(() => {
    // Ensure the initial size is set correctly
    if (windowRef.current) {
      const { clientWidth, clientHeight } = windowRef.current;
      setSize({ width: clientWidth, height: clientHeight });
      onResize(id, clientWidth, clientHeight); // Pass the resize event up to the Dashboard
    }
  }, []);

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
    if (isResizing) {
      const mouseX = e.clientX / scale;
      const mouseY = e.clientY / scale;

      const newWidth = mouseX - position.x;
      const newHeight = mouseY - position.y;

      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = (e) => {
    if (isDragging) {
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
    }
    if (isResizing) {
      setIsResizing(false);
      document.body.classList.remove('disable-select');

      // Capture the final size on mouse up
      const { clientWidth, clientHeight } = windowRef.current;

      // Update the size state to the final values
      setSize({ width: clientWidth, height: clientHeight });

      // Call onResize after resizing is complete
      onResize(id, clientWidth, clientHeight);

      // Update the database with the final size
      updateSizeInDatabase(clientWidth, clientHeight);
    }
  };

  useEffect(() => {
    if (isDragging || isResizing) {
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
  }, [isDragging, isResizing]);

  const updateSizeInDatabase = async (width, height) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/tasklists/${id}/update_size/`, { size_horizontal: width, size_vertical: height });
      console.log('Size updated successfully:', response.data);
    } catch (error) {
      console.error('Error updating size:', error);
    }
  };

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

  const handleResizeMouseDown = (e) => {
    setIsResizing(true);
    document.body.classList.add('disable-select');
  };

  return (
    <div
      id={`window-${id}`}
      ref={windowRef}
      className={`${styles.window} ${isDragging ? styles.dragging : ''} ${isResizing ? styles.resizing : ''}`} // Updated class name
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
      <div
        className={styles.resizeHandle}
        onMouseDown={handleResizeMouseDown}
      ></div>
    </div>
  );
};

export default Window;
