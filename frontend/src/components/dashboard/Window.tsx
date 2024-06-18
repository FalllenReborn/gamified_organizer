import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './window.module.css';
import axios from 'axios';

interface WindowProps {
  id: number;
  title: string;
  onClose: (id: number) => void;
  onRename: (id: number) => void;
  onDrag?: (id: number, x: number, y: number) => void;
  translate: { x: number; y: number };
  scale: number;
  onClick: () => void;
  zIndex: number;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  onResize: (id: number, width: number, height: number) => void;
  openPopup: (windowId: number, nest_id: number | null) => void;
  onPositionUpdate?: (id: number, x: number, y: number) => void;
  onSizeUpdate?: (id: number, width: number, height: number) => void;
  registerTaskUpdateCallback: (id: number, callback: () => void) => void;
}

interface Task {
  task_id: number;
  task_name: string;
  list_task: number;
  created_date_time: string;
  nested_id: number | null;
  expanded: boolean;
}

const Window: React.FC<WindowProps> = ({
  id, 
  title, 
  onClose, 
  onRename, 
  translate, 
  scale, 
  onClick, 
  zIndex, 
  initialX, 
  initialY, 
  initialWidth, 
  initialHeight, 
  onResize, 
  openPopup, 
  registerTaskUpdateCallback
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  const sizeRef = useRef(size);

  const updateSizeInDatabase = useCallback(async (width: number, height: number) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/tasklists/${id}/update_lists/`, { size_horizontal: width, size_vertical: height });
      console.log('Size updated successfully:', response.data);
    } catch (error) {
      console.error('Error updating size:', error);
    }
  }, [id]);

  const updatePositionInDatabase = useCallback(async (x: number, y: number) => {
    try {
      const response = await axios.put(`http://localhost:8000/api/tasklists/${id}/update_lists/`, { x_axis: x, y_axis: y });
      console.log('Position updated successfully:', response.data);
    } catch (error) {
      console.error('Error updating position:', error);
    }
  }, [id]);

  useEffect(() => {
    positionRef.current = position;
    sizeRef.current = size;
  }, [position, size]);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/tasks/?window_id=${id}`);
      console.log('Retrieved tasks data:', response.data);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchTasks();
    registerTaskUpdateCallback(id, fetchTasks);
  }, [fetchTasks, id, registerTaskUpdateCallback]);

  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX / scale - position.x,
      y: e.clientY / scale - position.y,
    });
    onClick();
    document.body.classList.add('disable-select');
  }, [position, scale, onClick]);

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const mouseX = e.clientX / scale;
      const mouseY = e.clientY / scale;
      setPosition({ x: mouseX - startPos.x, y: mouseY - startPos.y });
    }
  }, [isDragging, scale, startPos]);

  const handleDragEnd = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.classList.remove('disable-select');
      updatePositionInDatabase(positionRef.current.x, positionRef.current.y);
    }
  }, [isDragging, updatePositionInDatabase]);

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setStartPos({
      x: e.clientX / scale,
      y: e.clientY / scale,
    });
    document.body.classList.add('disable-select');
  };

  const handleResizeMove = (e: MouseEvent) => {
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
      const updatedSize = sizeRef.current;
      updateSizeInDatabase(updatedSize.width, updatedSize.height);
      updatePositionInDatabase(positionRef.current.x, positionRef.current.y);
      onResize(id, updatedSize.width, updatedSize.height);
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
  }, [isDragging, handleDragMove, handleDragEnd]);

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
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  const toggleDropdown = () => {
    setIsDropdownOpen((prevState) => !prevState);
  };

  const handleHide = () => {
    console.log(`Hide window ${id}`);
    setIsDropdownOpen(false);
  };

  const handleDelete = async () => {
    console.log(`Delete window ${id}`);
    onClose(id);
    setIsDropdownOpen(false);
  };

  const handleRename = () => {
    onRename(id);
    setIsDropdownOpen(false);
  };

  const toggleExpand = async (taskId: number, currentState: boolean) => {
    const newExpandedState = !currentState;
    try {
      await axios.patch(`http://localhost:8000/api/tasks/${taskId}/update_task/`, { expanded: newExpandedState });
      setTasks((prevTasks) => 
        prevTasks.map((task) => 
          task.task_id === taskId ? { ...task, expanded: newExpandedState } : task
        )
      );
    } catch (error) {
      console.error('Error updating task state:', error);
    }
  };

  const renderNestedTasks = (outerTaskId: number) => {
    console.log(`Outer ID: ${outerTaskId}`)
    return tasks
      .filter((task) => task.nested_id === outerTaskId)
      .sort((a, b) => new Date(a.created_date_time).getTime() - new Date(b.created_date_time).getTime())
      .map((task) => (
        <div key={task.task_id} className={styles.taskContainer}>
          <div className={styles.taskRow}>
            <div className={styles.taskCell}>
              <button onClick={() => toggleExpand(task.task_id, task.expanded)} className={styles.expandButton}>
                {task.expanded ? '▲' : '▼'}
              </button>
              <div className={styles.taskText}>{task.task_name}</div>
              <div className={styles.checkbox}>
                <input type="checkbox" />
              </div>
            </div>
          </div>
          {task.expanded && (
            <div className={styles.nestedTasks}>
              {renderNestedTasks(task.task_id)}
              <button className={styles.addNestedTaskButton} onClick={() => openPopup(id, task.task_id)}>+ Create new task</button>
            </div>
          )}
        </div>
      ));
  };

  return (
    <div
      id={`window-${id}`}
      ref={windowRef}
      className={`${styles.outerWrapper} ${isDragging ? styles.dragging : ''}`}
      style={{
        top: `${position.y * scale}px`,
        left: `${position.x * scale}px`,
        width: `${size.width + 20}px`,
        height: `${size.height + 20}px`,
        transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
        transformOrigin: 'top left',
        zIndex: zIndex
      }}
    >
      <div 
      id={`window-${id}`}
      ref={windowRef}
      className={styles.window}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}>
        <div className={styles.taskbar} onMouseDown={handleDragStart}>
          <span className={styles.title}>{title}</span>
          <div className={styles.bottomBar}>
            <span className={styles.id}>ID: {id}</span>
            <div className={styles.buttons}>
              <button className={styles.addButton} onClick={() => openPopup(id, null)}>+</button>
              <button className={styles.dropdownButton} onClick={toggleDropdown}>⋮</button>
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
          {tasks
            .filter((task) => task.nested_id === null)
            .map((task) => (
            <div key={task.task_id} className={styles.taskContainer}>
              <div className={styles.taskRow}>
                <div className={styles.taskCell}>
                  <button onClick={() => toggleExpand(task.task_id, task.expanded)} className={styles.expandButton}>
                    {task.expanded ? '▲' : '▼'}
                  </button>
                  <div className={styles.taskText}>{task.task_name}</div>
                  <div className={styles.checkbox}>
                    <input type="checkbox" />
                  </div>
                </div>
              </div>
              {task.expanded && (
                <div className={styles.nestedTasks}>
                  {renderNestedTasks(task.task_id)}
                  <button className={styles.addNestedTaskButton} onClick={() => openPopup(id, task.task_id)}>+ Create new task</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
        <div className={`${styles.resizeHandle} ${styles.right}`} onMouseDown={(e) => handleResizeStart(e, 'right')}></div>
        <div className={`${styles.resizeHandle} ${styles.bottom}`} onMouseDown={(e) => handleResizeStart(e, 'bottom')}></div>
        <div className={`${styles.resizeHandle} ${styles.left}`} onMouseDown={(e) => handleResizeStart(e, 'left')}></div>
        <div className={`${styles.resizeHandle} ${styles.top}`} onMouseDown={(e) => handleResizeStart(e, 'top')}></div>
        <div className={`${styles.resizeHandle} ${styles.topLeft}`} onMouseDown={(e) => handleResizeStart(e, 'top-left')}></div>
        <div className={`${styles.resizeHandle} ${styles.topRight}`} onMouseDown={(e) => handleResizeStart(e, 'top-right')}></div>
        <div className={`${styles.resizeHandle} ${styles.bottomLeft}`} onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}></div>
        <div className={`${styles.resizeHandle} ${styles.bottomRight}`} onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}></div>
        <div
          className={styles.resizer}
          onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
        />
    </div>
  );
};

export default Window;
