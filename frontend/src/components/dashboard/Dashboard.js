import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Sidebar from '../sidebar/Sidebar';
import ResetButton from '../sidebar/ResetButton';
import styles from './dashboard.module.css';
import ToggleButton from '../sidebar/ToggleButton';
import Window from './Window';
import RenamePopup from './RenamePopup';
import axios from 'axios';

const Dashboard = ({ onReturnHome }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [scale, setScale] = useState(1);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [windows, setWindows] = useState([]);
  const [windowOrder, setWindowOrder] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [renamePopup, setRenamePopup] = useState({ isOpen: false, id: null, defaultValue: '' });
  const [taskLists, setTaskLists] = useState([]);
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
    // Fetch task lists from the backend API when the component mounts
    const fetchTaskLists = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/tasklists/'); // Adjust the endpoint as per your Django URL configuration
        setTaskLists(response.data); // Update taskLists state with fetched data
        console.log('Fetched task lists:', response.data); // Log fetched data in console

      } catch (error) {
        console.error('Error fetching task lists:', error);
      }
    };

    fetchTaskLists(); // Call the fetchTaskLists function
  }, []); // Ensure the effect runs only once when the component mounts

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

  const handleRename = (id) => {
    console.log(`Trying to rename window with id: ${id}`);
    console.log('Current windows:', windows);
  
    const windowToUpdate = windows.find(w => w.id === id);
    if (windowToUpdate) {
      setRenamePopup({ isOpen: true, id, defaultValue: windowToUpdate.title });
    } else {
      console.error(`Window with id ${id} not found.`);
    }
  };

  useEffect(() => {
  if (taskLists.length > 0) {
    // Map over the task lists and create window objects
    const newWindows = taskLists.map((taskList) => ({
      id: taskList.list_id,
      title: taskList.list_name,
      initialX: taskList.x_axis,
      initialY: taskList.y_axis,
      initialWidth: taskList.size_horizontal, // Include the initial width
      initialHeight: taskList.size_vertical // Include the initial height
    }));
    // Update the windows state with the new windows
    setWindows(newWindows);
  }
}, [taskLists]);

const handleSaveRename = async (id, newName) => {
  try {
    // Make an API request to rename the task list
    await axios.put(`http://localhost:8000/api/tasklists/${id}/update_name/`, { list_name: newName });
    // Fetch the updated task lists
    const response = await axios.get('http://localhost:8000/api/tasklists/');
    setTaskLists(response.data); // Update taskLists state with fetched data
    console.log('Fetched updated task lists:', response.data); // Log fetched data in console

  } catch (error) {
    console.error('Error renaming task list or fetching updated task lists:', error);
  }

  // Close the rename popup
  setRenamePopup({ isOpen: false, id: null, defaultValue: '' });
};

const handleCreateNewList = async () => {
  try {
    // Create a new list in the backend
    const response = await axios.post('http://localhost:8000/api/tasklists/', {});
    const newList = response.data;

    // Add the new list to the taskLists state
    setTaskLists((prevTaskLists) => [...prevTaskLists, newList]);

    // Open rename popup for the newly created list
    setRenamePopup({ isOpen: true, id: newList.list_id, defaultValue: newList.list_name || 'New List' });

  } catch (error) {
    console.error('Error creating new task list:', error);
  }
};

const handleDragWindow = (id, x, y) => {
  setWindows((prevWindows) =>
    prevWindows.map((window) =>
      window.id === id ? { ...window, initialX: x, initialY: y } : window
    )
  );
};

const handleResizeWindow = (id, width, height) => {
  console.log(`Resizing window ${id} to width=${width}, height=${height}`);
  // Update the window state with the new size
  setWindows((prevWindows) =>
    prevWindows.map((window) =>
      window.id === id ? { ...window, initialWidth: width, initialHeight: height } : window
    )
  );
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
        {isSidebarVisible && <Sidebar onReturnHome={onReturnHome} onCreateNewList={handleCreateNewList} />}
        <ResetButton onClick={handleReset} />
        {taskLists.map((taskList) => (
          <Window 
            key={taskList.list_id} 
            id={taskList.list_id} 
            title={taskList.list_name}
            className={styles.window} 
            onClose={handleCloseWindow} 
            onRename={handleRename} 
            translate={translate} 
            scale={scale} 
            onClick={() => bringWindowToFront(taskList.list_id)}
            zIndex={windowOrder.indexOf(taskList.list_id) + 1}
            initialX={taskList.x_axis} // Use values from the fetched task list
            initialY={taskList.y_axis} // Use values from the fetched task list
            initialWidth={taskList.size_horizontal}
            initialHeight={taskList.size_vertical}
            onDrag={handleDragWindow} // Pass the handleDragWindow function
            onResize={handleResizeWindow} // Pass the handleResizeWindow function
            onPositionUpdate={(id, x, y) => handleDragWindow(id, x, y)} // New callback for updating position
            onSizeUpdate={(id, width, height) => handleResizeWindow(id, width, height)} // New callback for updating size
          />
        ))}
        {renamePopup.isOpen && (
        <RenamePopup
          isOpen={renamePopup.isOpen}
          id={renamePopup.id}
          defaultValue={renamePopup.defaultValue}
          onSave={handleSaveRename}
          onClose={() => setRenamePopup({ isOpen: false, id: null, defaultValue: '' })}
        />
      )}
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
