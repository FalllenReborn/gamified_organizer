import React, { useContext, useState, useRef, useEffect } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Sidebar from '../sidebar/Sidebar';
import ResetButton from '../sidebar/ResetButton';
import styles from './dashboard.module.css';
import ToggleButton from '../sidebar/ToggleButton';
import Window from './Window';
import RenamePopup from './RenamePopup';
import CreateTaskPopup from './CreateTaskPopup';
import axios from 'axios';

const Dashboard = ({ onReturnHome }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [scale, setScale] = useState(1);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [windows, setWindows] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [renamePopup, setRenamePopup] = useState({ isOpen: false, id: null, defaultValue: '' });
  const [taskLists, setTaskLists] = useState([]);
  const [largestZIndex, setLargestZIndex] = useState(5000001);
  const [maxQueZIndex, setMaxQueZIndex] = useState(5000000);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentWindowId, setCurrentWindowId] = useState(null);
  const dashboardRef = useRef(null);
  const sidebarWidth = 250;

  const openPopup = (windowId) => {
    setCurrentWindowId(windowId);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  const handleConfirm = async (taskName) => {
    try {
      console.log(`ID: ${currentWindowId}`)
      console.log(`Name: ${taskName}`)
      const response = await axios.post('http://localhost:8000/api/tasks/create_task/', { list_id: currentWindowId, task_name: taskName });
      console.log('Task created successfully:', response.data);
      // Optionally update the tasks state here if needed
      closePopup();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };
  
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
    document.body.classList.add('disable-select');
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
    document.body.classList.remove('disable-select');
  };

  const handleWheel = (e) => {
    const scaleFactor = 0.1;
    const delta = e.deltaY > 0 ? -scaleFactor : scaleFactor;

    const rect = dashboardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newScale = Math.max(0.33, scale + delta);
   
    const scaleRatio = newScale / scale;
    const newTranslateX = mouseX - scaleRatio * (mouseX - translate.x);
    const newTranslateY = mouseY - scaleRatio * (mouseY - translate.y);

    setTranslate({
      x: newTranslateX,
      y: newTranslateY,
    });
    setScale(newScale);
  };

  useEffect(() => {
    fetchTaskLists();
  }, []);

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

  const handleToggle = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleCloseWindow = async (id) => {
    try {
      await handleListDeletion(id);
      await fetchTaskLists();
    } catch (error) {
      console.error('Error deleting task list:', error);
    }
  };
  
  const fetchTaskLists = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/tasklists/');
      const fetchedTaskLists = response.data;
  
      const sortedTaskLists = fetchedTaskLists.sort((a, b) => a.zindex - b.zindex);
      setTaskLists(sortedTaskLists);

      const highestZIndex = Math.max(...sortedTaskLists.map(taskList => taskList.zindex));
      setLargestZIndex(highestZIndex > 5000000 && highestZIndex < 6000000 ? highestZIndex : 5000001);
      setMaxQueZIndex(5000000 + 1 * sortedTaskLists.length);
      
    } catch (error) {
      console.error('Error fetching task lists:', error);
    }
  };

  const updateMaxQueZIndex = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/tasklists/');
      const count = response.data.length;
      setMaxQueZIndex(500 + count);
    } catch (error) {
      console.error('Error updating maxQueZIndex:', error);
    }
  };
  
  const bringWindowToFront = async (id) => {
    const clickedWindow = taskLists.find(window => window.list_id === id);
    const clickedZIndex = clickedWindow.zindex;

    if (clickedZIndex < largestZIndex) {
      if (largestZIndex < maxQueZIndex) {
        const newZIndex = largestZIndex + 1;
        setLargestZIndex(newZIndex);
        await updateZIndexInDatabase(clickedWindow.list_id, newZIndex);
      } else if (largestZIndex === maxQueZIndex) {
        for (const window of taskLists) {
          if (window.zindex > clickedZIndex) {
            const newZIndex = window.zindex - 1;
            await updateZIndexInDatabase(window.list_id, newZIndex);
          }
        }
        await updateZIndexInDatabase(clickedWindow.list_id, maxQueZIndex);
      }
    }

    await fetchTaskLists();
  };

  const handleListDeletion = async (id) => {
    try {
      const deletedList = taskLists.find(taskList => taskList.list_id === id);
      const deletedZIndex = deletedList.zindex;
  
      await axios.delete(`http://localhost:8000/api/tasklists/${id}/`);
  
      for (const taskList of taskLists) {
        if (taskList.zindex > deletedZIndex) {
          const newZIndex = taskList.zindex - 1;
          await updateZIndexInDatabase(taskList.list_id, newZIndex);
        }
      }

      setLargestZIndex(prev => prev - 1);
      await updateMaxQueZIndex();
  
     } catch (error) {
      console.error('Error deleting list:', error);
    }
  };
  
  useEffect(() => {
    updateMaxQueZIndex();
  }, []);
  
  const updateZIndexInDatabase = async (id, zIndex) => {
    try {
      await axios.put(`http://localhost:8000/api/tasklists/${id}/update_lists/`, { zindex: zIndex });
    } catch (error) {
      console.error('Error updating z-index:', error);
    }
  };

  const handleRename = (id) => {
    const windowToUpdate = windows.find(w => w.id === id);
    if (windowToUpdate) {
      setRenamePopup({ isOpen: true, id, defaultValue: windowToUpdate.title });
    } else {
      console.error(`Window with id ${id} not found.`);
    }
  };

    useEffect(() => {
    if (taskLists.length > 0) {
      const newWindows = taskLists.map((taskList) => ({
        id: taskList.list_id,
        title: taskList.list_name,
        initialX: taskList.x_axis,
        initialY: taskList.y_axis,
        initialWidth: taskList.size_horizontal,
        initialHeight: taskList.size_vertical,
        zIndex: taskList.zindex
      }));
      setWindows(newWindows);
    }
  }, [taskLists]);

  const handleSaveRename = async (id, newName) => {
    try {
      await axios.put(`http://localhost:8000/api/tasklists/${id}/update_name/`, { list_name: newName });
      await fetchTaskLists();
    } catch (error) {
      console.error('Error renaming task list or fetching updated task lists:', error);
    }

    setRenamePopup({ isOpen: false, id: null, defaultValue: '' });
  };

  const handleCreateNewList = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/tasklists/', {});
      const newList = response.data;

      setTaskLists((prevTaskLists) => [...prevTaskLists, newList]);

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
        onMouseDown={(e) => e.stopPropagation()}
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
            zIndex={taskList.zindex}
            initialX={taskList.x_axis}
            initialY={taskList.y_axis}
            initialWidth={taskList.size_horizontal}
            initialHeight={taskList.size_vertical}
            onDrag={handleDragWindow}
            onResize={handleResizeWindow}
            onPositionUpdate={(id, x, y) => handleDragWindow(id, x, y)}
            onSizeUpdate={(id, width, height) => handleResizeWindow(id, width, height)}
            openPopup={openPopup}
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
        {isPopupOpen && (
          <CreateTaskPopup
            onClose={closePopup}
            onConfirm={handleConfirm}
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
