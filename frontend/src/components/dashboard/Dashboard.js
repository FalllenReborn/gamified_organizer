import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Sidebar from '../sidebar/Sidebar';
import ResetButton from '../sidebar/ResetButton';
import styles from './dashboard.module.css';
import ToggleButton from '../sidebar/ToggleButton';
import Window from './Window';

const Dashboard = ({ onReturnHome, createNewList, onCreateNewList }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [scale, setScale] = useState(1);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [windows, setWindows] = useState([]);
  const [windowOrder, setWindowOrder] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const dashboardRef = useRef(null);
  const sidebarWidth = 250;

  const getInitialTranslate = () => {
    const dashboardRect = dashboardRef.current.getBoundingClientRect();
    const centerX = (dashboardRect.width / 2) - (sidebarWidth / 2);
    const centerY = dashboardRect.height / 2;
    return { x: centerX, y: centerY };
  };

  const handleMouseDown = (e) => {
    setIsDraggingSidebar(true);
    setIsDragging(true);
    setStartPos({
      x: e.clientX - translate.x,
      y: e.clientY - translate.y,
    });
    document.body.classList.add('disable-select'); // Apply disable-select class to prevent text selection
  };

  const handleMouseMove = (e) => {
    if (isDraggingSidebar) {
      setTranslate({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingSidebar(false);
    setIsDragging(false);
    document.body.classList.remove('disable-select'); // Apply disable-select class to prevent text selection
  };

  const handleWheel = (e) => {
    e.preventDefault();

    const scaleFactor = 0.1;
    const delta = e.deltaY > 0 ? -scaleFactor : scaleFactor;

    // Calculate mouse position relative to the dashboard
    const rect = dashboardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate the new scale
    const newScale = Math.max(0.33, scale + delta);

    // Calculate the translation adjustments
    const scaleRatio = newScale / scale;
    const newTranslateX = mouseX - scaleRatio * (mouseX - translate.x);
    const newTranslateY = mouseY - scaleRatio * (mouseY - translate.y);

    // Update the state
    setTranslate({
      x: newTranslateX,
      y: newTranslateY,
    });
    setScale(newScale);
  };

  useEffect(() => {
    if (createNewList) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const newWindow = {
        id: windows.length,
        initialX: (viewportWidth / 2 - 150 + sidebarWidth / 2) / scale - translate.x / scale, // Centering and adjusting for scale and translation
        initialY: (viewportHeight / 2 - 75) / scale - translate.y / scale // Centering and adjusting for scale and translation
      };
      setWindows((prevWindows) => [...prevWindows, newWindow]);
      setWindowOrder((prevOrder) => [...prevOrder, newWindow.id]);
    }
  }, [createNewList]);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (dashboardRef.current) {
      const initialTranslate = getInitialTranslate();
      setTranslate(initialTranslate);
    }
  }, [dashboardRef.current]);

  const handleReset = () => {
    const initialTranslate = getInitialTranslate();
    setTranslate(initialTranslate);
    setScale(1);
  };

  const handleSidebarDragStart = (e) => {
    e.stopPropagation();
  };

  const handleToggle = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleCloseWindow = (id) => {
    setWindows((prevWindows) => prevWindows.filter(window => window.id !== id));
    setWindowOrder((prevOrder) => prevOrder.filter(windowId => windowId !== id));
  };

  const bringWindowToFront = (id) => {
    setWindowOrder((prevOrder) => [...prevOrder.filter(windowId => windowId !== id), id]);
    setWindows((prevWindows) => {
      const windowIndex = prevWindows.findIndex((win) => win.id === id);
      if (windowIndex === -1) return prevWindows;
      const updatedWindows = [...prevWindows];
      const [broughtToFront] = updatedWindows.splice(windowIndex, 1);
      updatedWindows.push(broughtToFront);
      return updatedWindows;
    });
  };

  const backgroundSize = 50 * scale;
  const backgroundPosition = `${translate.x}px ${translate.y}px`;

  return (
    <div
      className={`${styles.dashboardContainer} ${isDragging ? styles.dragging : ''} ${isDarkMode ? styles.darkMode : styles.lightMode}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      style={{
        '--background-size': `${backgroundSize}px ${backgroundSize}px`,
        '--background-position': backgroundPosition,
      }}
      ref={dashboardRef}
    >
      <div
        className={`${styles.clickableArea} ${isDraggingSidebar && styles.hidden}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
      />
      <div
        className={styles.sidebarArea}
        onMouseDown={(e) => e.stopPropagation()} // Prevent clicks on the sidebar from reaching the dashboard
      >
        <ToggleButton onClick={handleToggle} isVisible={isSidebarVisible} />
        {isSidebarVisible && <Sidebar onReturnHome={onReturnHome} onCreateNewList={onCreateNewList} />}
        <ResetButton onClick={handleReset} />
        {windows.map((window, index) => (
          <Window 
            key={window.id} 
            id={window.id} 
            className={styles.window} 
            onClose={handleCloseWindow} 
            translate={translate} 
            scale={scale} 
            onClick={() => bringWindowToFront(window.id)}
            zIndex={windowOrder.indexOf(window.id) + 1}
            initialX={window.initialX}
            initialY={window.initialY}
          />
        ))}
      </div>
      <div
        className={styles.dashboardContent}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
        }}
      >
        <div
          className={styles.redDot}
          style={{
            left: `calc(0px + ${sidebarWidth}px)`,
            top: '0',
            transform: `translate(-50%, -50%) scale(1)`,
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;
