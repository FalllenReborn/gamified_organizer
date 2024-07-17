import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './window.module.css';
import axios from 'axios';

interface WindowProps {
  id: number;
  title: string;
  checkedTasks: number[];
  toggleTaskChecked: (taskId: number) => void;
  onClose: (id: number) => void;
  onRename: (id: number) => void;
  onDrag: (id: number, x: number, y: number, type: string) => void;
  translate: { x: number; y: number };
  scale: number;
  onClick: () => void;
  zIndex: number;
  initialX: number;
  initialY: number;
  initialWidth: number;
  initialHeight: number;
  rewards: any[];
  transactions: any[];
  barsData: any[];
  currencies: any[];
  detailView: boolean;
  onResize: (id: number, width: number, height: number, type: string) => void;
  openPopup: (windowId: number, nest_id: number | null, editMode: any, task: any) => void;
  onPositionUpdate: (id: number, x: number, y: number) => void;
  onSizeUpdate: (id: number, width: number, height: number) => void;
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
  registerTaskUpdateCallback,
  checkedTasks, 
  toggleTaskChecked,
  rewards,
  transactions,
  barsData,
  currencies,
  detailView,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDetailView, setIsDetailView] = useState(detailView);
  const [hoveredTask, setHoveredTask] = useState<number | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef(position);
  const sizeRef = useRef(size);

  const updateSizeInDatabase = useCallback(async (width: number, height: number) => {
    const constrainedWidth = width < 50 ? 50 : width;
    const constrainedHeight = height < 50 ? 50 : height;

    try {
      const response = await axios.put(`http://localhost:8000/api/tasklists/${id}/update_lists/`, { size_horizontal: constrainedWidth, size_vertical: constrainedHeight });
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

  useEffect(() => {
    setPosition({ x: initialX, y: initialY });
    setSize({ width: initialWidth, height: initialHeight });
}, [initialX, initialY, initialWidth, initialHeight]);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/tasks/?window_id=${id}`);
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
    const targetElement = e.target as HTMLElement;
    if (targetElement.closest(`.${styles.arrow}`)) {
      return; // Prevent dragging if clicking on taskbar buttons
    }
    if (targetElement.closest(`.${styles.dropdownButton}`)) {
      return; // Prevent dragging if clicking on taskbar buttons
    }
    if (targetElement.closest(`.${styles.addButton}`)) {
      return; // Prevent dragging if clicking on taskbar buttons
    }
    setIsDragging(true);
    setStartPos({
      x: e.clientX / scale - position.x,
      y: e.clientY / scale - position.y,
    });
    onClick();
    document.body.classList.add(styles.disableSelect);
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
      document.body.classList.remove(styles.disableSelect);
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
    document.body.classList.add(styles.disableSelect);
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
        if (newWidth - dx >= 50) {
            newWidth -= dx;
            newX += dx;
        } else {
            newX += newWidth - 50;
            newWidth = 50;
        }
      }
      if (resizeDirection.includes('top')) {
          if (newHeight - dy >= 50) {
              newHeight -= dy;
              newY += dy;
          } else {
              newY += newHeight - 50;
              newHeight = 50;
          }
      }
    
      // Apply the constraints
      newWidth = Math.max(newWidth, 50);
      newHeight = Math.max(newHeight, 50);

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
      document.body.classList.remove(styles.disableSelect);
      const updatedSize = sizeRef.current;
      updateSizeInDatabase(updatedSize.width, updatedSize.height);
      updatePositionInDatabase(positionRef.current.x, positionRef.current.y);
      onResize(id, updatedSize.width, updatedSize.height, 'taskList');
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

  const handleDetailViewToggle = async () => {
    const newDetailState = !isDetailView;
    try {
      await axios.put(`http://localhost:8000/api/tasklists/${id}/update_lists/`, { detail_view: newDetailState });
      setIsDetailView(newDetailState);
      console.log(`Detail: ${newDetailState}`)
    } catch (error) {
      console.error('Error updating task state:', error);
    }
    
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

  const getRewardsForTask = (taskId: number) => {
    return rewards.filter((reward) => reward.task === taskId);
  };

  const getTransactionsForTask = (taskId: number) => {
    return transactions.filter((transaction) => transaction.task === taskId);
  };

  const getXPName = (barId: number) => {
    const bar = barsData.find(bar => bar.bar_id === barId);
    return bar ? bar.xp_name : 'XP';
  };

  const getCurrencyName = (currencyId: number) => {
    const currency = currencies.find(currency => currency.currency_id === currencyId);
    return currency ? currency.currency_name : 'Currency';
  };

  const handleEditTask = (taskId: number) => {
    const task = tasks.find(t => t.task_id === taskId);
    if (task) {
      openPopup(id, task.nested_id, true, task);
    }
  };

  const renderNestedTasks = (outerTaskId: number) => {
    return tasks
      .filter((task) => task.nested_id === outerTaskId)
      .sort((a, b) => new Date(a.created_date_time).getTime() - new Date(b.created_date_time).getTime())
      .map((task) => (
        <div key={task.task_id} className={styles.taskContainer}>
          <div className={styles.taskRow}>
            <div className={styles.taskNestedCell}>
              <div className={styles.classicView} 
                style={{ width: isDetailView ? '40%' : '100%' }}
                onMouseEnter={() => setHoveredTask(task.task_id)} 
                onMouseLeave={() => setHoveredTask(null)}
              >
                <div className={styles.checkbox}>
                  <input
                      type="checkbox"
                      onChange={() => toggleTaskChecked(task.task_id)}
                      checked={checkedTasks.includes(task.task_id)}
                    />
                </div>
                <button onClick={() => toggleExpand(task.task_id, task.expanded)} className={styles.expandButton}>
                  {task.expanded ? '▲' : '▼'}
                </button>
                <div className={styles.taskText}>{task.task_name}</div>
                {hoveredTask === task.task_id && (
                  <button className={styles.editButton} onClick={() => handleEditTask(task.task_id)}>Edit</button>
                )}
              </div>
              {isDetailView && (
                <div className={styles.detailView}>
                  <div className={styles.column} id={styles.progress}>
                    <div className={styles.rewards}>
                      {getRewardsForTask(task.task_id).map((reward) => (
                        <span key={reward.reward_id} className={styles.reward}>
                          {getXPName(reward.bar)}: {reward.points}<br />
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.column} id={styles.currencies}>
                    <div className={styles.transactions}>
                      {getTransactionsForTask(task.task_id).map((transaction) => (
                        <span key={transaction.transaction_id} className={styles.transaction}>
                          {getCurrencyName(transaction.currency)}: {transaction.amount}<br />
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.column} id={styles.items}>Items</div>
                </div>
              )}
            </div>
          </div>
          {task.expanded && (
            <div className={styles.nestedTasks}>
              {renderNestedTasks(task.task_id)}
              <button className={styles.addNestedTaskButton} onClick={() => openPopup(id, task.task_id, false, null)}>+ Create new task</button>
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
        }}
        onMouseDown={onClick}
      >
        <div className={styles.taskbar} onMouseDown={handleDragStart}>
          <div className={styles.classicViewHeader} style={{ width: isDetailView ? '40%' : '100%' }}>
            <div className={styles.topBar}>
              <span className={styles.title}>{title}</span>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDetailViewToggle();
                }}
                draggable={false}
                className={styles.arrow} 
              >
                {isDetailView ? '»' : '«'}
              </div>
            </div>
            <div className={styles.bottomBar}>
              <div className={styles.buttons}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown();
                  }}
                  draggable={false}
                  className={styles.dropdownButton} 
                >
                  ⋮
                </button>
                {isDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    <button onClick={handleHide}>Hide</button>
                    <button onClick={handleDelete}>Delete</button>
                    <button onClick={handleRename}>Edit</button>
                  </div>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    openPopup(id, null, false, null)
                  }}
                  draggable={false}
                  className={styles.addButton}
                >
                  +
                </button>
              </div>
              <span className={styles.id}>ID: {id}</span>
            </div>
          </div>
          {isDetailView && (
            <div className={styles.detailViewHeaders}>
              <div className={styles.columnHeader} id={styles.progressHeader}>Progress</div>
              <div className={styles.columnHeader} id={styles.currenciesHeader}>Currencies</div>
              <div className={styles.columnHeader} id={styles.itemsHeader}>Items</div>
            </div>
          )}
        </div>
        <div className={styles.content}>
          {tasks
            .filter((task) => task.nested_id === null)
            .map((task) => (
            <div key={task.task_id} className={styles.taskContainer}>
              <div className={styles.taskRow}>
                <div className={styles.taskCell}>
                  <div className={styles.classicView} 
                  style={{ width: isDetailView ? '40%' : '100%' }}
                  onMouseEnter={() => setHoveredTask(task.task_id)} 
                  onMouseLeave={() => setHoveredTask(null)}
                  >
                    <div className={styles.checkbox}>
                      <input
                        type="checkbox"
                        onChange={() => toggleTaskChecked(task.task_id)}
                        checked={checkedTasks.includes(task.task_id)}
                      />
                    </div>
                    <button onClick={() => toggleExpand(task.task_id, task.expanded)} className={styles.expandButton}>
                      {task.expanded ? '▲' : '▼'}
                    </button>
                    <div className={styles.taskText}>{task.task_name}</div>
                    {hoveredTask === task.task_id && (
                      <button className={styles.editButton} onClick={() => handleEditTask(task.task_id)}>Edit</button>
                    )}
                  </div>
                  {isDetailView && (
                    <div className={styles.detailView}>
                      <div className={styles.column} id={styles.progress}>
                        <div className={styles.rewards}>
                          {getRewardsForTask(task.task_id).map((reward) => (
                            <span key={reward.reward_id} className={styles.reward}>
                              {getXPName(reward.bar)}: {reward.points}<br />
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={styles.column} id={styles.currencies}>
                        <div className={styles.transactions}>
                          {getTransactionsForTask(task.task_id).map((transaction) => (
                            <span key={transaction.transaction_id} className={styles.transaction}>
                              {getCurrencyName(transaction.currency)}: {transaction.amount}<br />
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={styles.column} id={styles.items}>Items</div>
                    </div>
                  )}
                </div>
              </div>
              {task.expanded && (
                <div className={styles.nestedTasks}>
                  {renderNestedTasks(task.task_id)}
                  <button className={styles.addNestedTaskButton} onClick={() => openPopup(id, task.task_id, false, null)}>+ Create new task</button>
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
