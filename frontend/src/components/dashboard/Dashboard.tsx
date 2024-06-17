import React, { useContext, useState, useRef, useEffect, MouseEvent } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Sidebar from '../sidebar/Sidebar';
import ResetButton from '../sidebar/ResetButton';
import styles from './dashboard.module.css';
import ToggleButton from '../sidebar/ToggleButton';
import Window from './Window';
import RenamePopup from './RenamePopup';
import CreateTaskPopup from './CreateTaskPopup';
import axios from 'axios';

interface TaskList {
  list_id: number;
  list_name: string;
  x_axis: number;
  y_axis: number;
  size_horizontal: number;
  size_vertical: number;
  zindex: number;
}

interface RenamePopupState {
  isOpen: boolean;
  id: number | null;
  defaultValue: string;
}

interface WindowState {
  id: number;
  title: string;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  zIndex: number;
}

interface DashboardProps {
  onReturnHome: () => void;
  createNewList: boolean;
  onCreateNewList: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onReturnHome }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [scale, setScale] = useState(1);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [renamePopup, setRenamePopup] = useState<RenamePopupState>({ isOpen: false, id: null, defaultValue: '' });
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [largestZIndex, setLargestZIndex] = useState(5000001);
  const [maxQueZIndex, setMaxQueZIndex] = useState(5000000);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);
  const [nest, setNest] = useState<number | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const sidebarWidth = 250;

  const taskUpdateCallbacks = useRef<{ [key: number]: () => void }>({});

  const registerTaskUpdateCallback = (id: number, callback: () => void) => {
    taskUpdateCallbacks.current[id] = callback;
  };

  const openPopup = (windowId: number, nest_id: number | null) => {
    setCurrentWindowId(windowId);
    setNest(nest_id);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  const handleConfirm = async (taskName: string) => {
    try {
      if (currentWindowId === null) return;
      console.log(`Nest: ${nest}`)
      const response = await axios.post('http://localhost:8000/api/tasks/create_task/', { list_id: currentWindowId, task_name: taskName, nested_id: nest });
      console.log('Task created successfully:', response.data);
      closePopup();
      if (currentWindowId in taskUpdateCallbacks.current) {
        taskUpdateCallbacks.current[currentWindowId]();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const getInitialTranslate = () => {
    if (!dashboardRef.current) return { x: 0, y: 0 };
    const dashboardRect = dashboardRef.current.getBoundingClientRect();
    const centerX = (dashboardRect.width / 2) - (sidebarWidth / 2);
    const centerY = dashboardRect.height / 2;
    return { x: centerX, y: centerY };
  };

  const handleMouseDown = (e: MouseEvent) => {
    setIsDraggingSidebar(true);
    setIsDragging(true);
    setStartPos({
      x: e.clientX - translate.x,
      y: e.clientY - translate.y,
    });
    document.body.classList.add('disable-select');
  };

  const handleMouseMove = (e: MouseEvent) => {
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

  const handleWheel = (e: React.WheelEvent) => {
    const scaleFactor = 0.1;
    const delta = e.deltaY > 0 ? -scaleFactor : scaleFactor;

    if (!dashboardRef.current) return;

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

  const handleCloseWindow = async (id: number) => {
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
      const fetchedTaskLists: TaskList[] = response.data;

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

  const bringWindowToFront = async (id: number) => {
    const clickedWindow = taskLists.find(window => window.list_id === id);
    if (!clickedWindow) return;

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

  const handleListDeletion = async (id: number) => {
    try {
      const deletedList = taskLists.find(taskList => taskList.list_id === id);
      if (!deletedList) return;

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

  const updateZIndexInDatabase = async (id: number, zIndex: number) => {
    try {
      await axios.put(`http://localhost:8000/api/tasklists/${id}/update_lists/`, { zindex: zIndex });
    } catch (error) {
      console.error('Error updating z-index:', error);
    }
  };

  const handleRename = (id: number) => {
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
        zIndex: taskList.zindex,
      }));
      setWindows(newWindows);
    }
  }, [taskLists]);

  const handleSaveRename = async (id: number, newName: string) => {
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
      const newList: TaskList = response.data;

      setTaskLists((prevTaskLists) => [...prevTaskLists, newList]);

      setRenamePopup({ isOpen: true, id: newList.list_id, defaultValue: newList.list_name || 'New List' });
    } catch (error) {
      console.error('Error creating new task list:', error);
    }
  };

  const handleDragWindow = (id: number, x: number, y: number) => {
    setWindows((prevWindows) =>
      prevWindows.map((window) =>
        window.id === id ? { ...window, initialX: x, initialY: y } : window
      )
    );
  };

  const handleResizeWindow = (id: number, width: number, height: number) => {
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
      } as React.CSSProperties}
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
          <div key={taskList.list_id} className={`${styles.window} window`}>
          <Window 
            id={taskList.list_id} 
            title={taskList.list_name}
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
            registerTaskUpdateCallback={registerTaskUpdateCallback}
          />
          </div>
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
