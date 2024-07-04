import React, { useContext, useState, useRef, useEffect, MouseEvent } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Sidebar from '../sidebar/Sidebar';
import ResetButton from '../sidebar/ResetButton';
import styles from './dashboard.module.css';
import ToggleButton from '../sidebar/ToggleButton';
import Window from './Window';
import Bar from './Bar';
import Currencies from './Currencies';
import RenamePopup from '../popups/RenamePopup';
import CreateTaskPopup from '../popups/CreateTaskPopup';
import CreateBarPopup from '../popups/CreateBarPopup';
import CreateCurrencyPopup from '../popups/CreateCurrencyPopup';
import axios from 'axios';

interface TaskList {
  list_id: number;
  list_name: string;
  x_axis: number;
  y_axis: number;
  size_horizontal: number;
  size_vertical: number;
  zindex: number;
  total_points: number;
  detail_view: boolean;
}

interface BarData {
  bar_id: number;
  bar_name: string;
  xp_name: string;
  x_axis: number;
  y_axis: number;
  size_horizontal: number;
  size_vertical: number;
  zindex: number;
  full_cycle: number;
  total_points: number;
}

interface Bar {
  bar_id: number;
  bar_name: string;
}

interface Currency {
  currency_id: number;
  currency_name: string;
  owned: number;
}

interface CreateCurrencyState {
  isOpen: boolean;
  defaultValue: string;
}

interface RenamePopupState {
  isOpen: boolean;
  id: number | null;
  endpoint: string;
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

interface BarState {
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
  onCompleteTasks: () => void;
  onCreateNewBar: () => void;
  onCreateNewCurrency: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onReturnHome }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [scale, setScale] = useState(1);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [bars, setBars] = useState<BarState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [createCurrencyPopup, setCreateCurrencyPopup] = useState<CreateCurrencyState>({ isOpen: false, defaultValue: '' });
  const [renamePopup, setRenamePopup] = useState<RenamePopupState>({ isOpen: false, id: null, endpoint: '', defaultValue: '' });
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [barsData, setBarsData] = useState<BarData[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const largestZIndex = useRef(5000001);
  const maxZIndex = useRef(5000001);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);
  const [nest, setNest] = useState<number | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<number[]>([]);
  const [rewards, setRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const sidebarWidth = 0;

  const taskUpdateCallbacks = useRef<{ [key: number]: () => void }>({});

  const registerTaskUpdateCallback = (id: number, callback: () => void) => {
    taskUpdateCallbacks.current[id] = callback;
  };

  const toggleTaskChecked = (taskId: number) => {
    setCheckedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
    console.log(`Checked: ${checkedTasks}`);
  };

  const handleCompleteTasks = async () => {
    try {
      await Promise.all(
        checkedTasks.map((taskId) =>
          axios.delete(`http://localhost:8000/api/tasks/${taskId}/`)
        )
      );
      setCheckedTasks([]);
      fetchBars();
      fetchCurrencies();
      // Optionally, refresh the task list or handle state updates
    } catch (error) {
      console.error('Error deleting tasks:', error);
    }
  };

  const openPopup = (windowId: number, nest_id: number | null) => {
    setCurrentWindowId(windowId);
    setNest(nest_id);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
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
    fetchBars();
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

  const handleCloseBar = async (id: number) => {
    try {
      await handleBarDeletion(id);
      await fetchBars();
    } catch (error) {
      console.error('Error deleting bar:', error);
    }
  };

  const fetchRewards = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/rewards/');
      setRewards(response.data);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/transactions/');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/currencies/');
      setCurrencies(response.data); // Assuming the response.data is an array of currencies
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };
  
  useEffect(() => {
    fetchCurrencies();
    fetchTransactions();
    fetchRewards();
  }, []);

  const handleConfirm = async (
    taskName: string,
    rewards: { [barId: number]: number },
    transactions: { [currencyId: number]: number }
  ) => {
    try {
      if (currentWindowId === null) return;
      console.log(`Nest: ${nest}`);
  
      // Step 1: Create the task
      const taskPayload = {
        list_id: currentWindowId,
        task_name: taskName,
        nested_id: nest
      };
  
      console.log('Task Payload:', taskPayload);
  
      const response = await axios.post('http://localhost:8000/api/tasks/create_task/', taskPayload);
      console.log('Task created successfully:', response.data);
  
      // Get the created task's ID
      const taskId = response.data.task_id;
  
      // Step 2: Create rewards for each bar with assigned value
      const rewardPromises = Object.entries(rewards).map(([barId, points]) => {
        if (points > 0) {
          const rewardPayload = {
            task: taskId,
            bar: parseInt(barId, 10),
            points
          };
          console.log('Reward Payload:', rewardPayload);
          return axios.post('http://localhost:8000/api/rewards/', rewardPayload);
        }
        return null;
      }).filter(promise => promise !== null);
  
      // Step 3: Create transactions for each currency with assigned amount
      const transactionPromises = Object.entries(transactions).map(([currencyId, amount]) => {
        if (amount !== 0) {
          const transactionPayload = {
            task_id: taskId,
            currency_id: parseInt(currencyId, 10),
            amount
          };
          console.log('Transaction Payload:', transactionPayload);
          return axios.post('http://localhost:8000/api/transactions/create_transaction/', transactionPayload);
        }
        return null;
      }).filter(promise => promise !== null);
  
      // Combine reward and transaction promises
      const allPromises = [...rewardPromises, ...transactionPromises];
  
      // Execute all creation requests
      await Promise.all(allPromises);
  
      console.log('Rewards and transactions created successfully');
  
      // Handle the successful task, reward, and transaction creation
      closePopup();
      if (currentWindowId in taskUpdateCallbacks.current) {
        taskUpdateCallbacks.current[currentWindowId]();
      }
  
      fetchRewards();
      fetchTransactions();
  
    } catch (error) {
      console.error('Error creating task, rewards, or transactions:', error);
    }
  };

  const fetchTaskLists = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/tasklists/');
      const fetchedTaskLists: TaskList[] = response.data;
      const sortedTaskLists = fetchedTaskLists.sort((a, b) => a.zindex - b.zindex);
      setTaskLists(sortedTaskLists);
      updateMaxZIndex(sortedTaskLists, barsData);
    } catch (error) {
      console.error('Error fetching task lists:', error);
    }
    updateMaxZIndex(taskLists, barsData);
  };

  const fetchBars = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/bars/');
      const fetchedBars: BarData[] = response.data;
      const sortedBars = fetchedBars.sort((a, b) => a.zindex - b.zindex);
      setBarsData(sortedBars);
      updateMaxZIndex(taskLists, sortedBars);
    } catch (error) {
      console.error('Error fetching bars:', error);
    }
    updateMaxZIndex(taskLists, barsData);
  };

  const updateMaxZIndex = (taskLists: TaskList[], barsData: BarData[]) => {
    const allItems = [...taskLists, ...barsData];
    const highestZIndex = Math.max(...allItems.map(item => item.zindex));
    largestZIndex.current = highestZIndex > 5000000 && highestZIndex < 6000000 ? highestZIndex : 5000001;
    maxZIndex.current = (5000000 + allItems.length);
  };

  const bringItemToFront = async (id: number, type: 'taskList' | 'bar') => {
    updateMaxZIndex(taskLists, barsData);
    const items = [
      ...taskLists.map(item => ({ zindex: item.zindex, id: item.list_id, type: 'taskList' as const })),
      ...barsData.map(item => ({ zindex: item.zindex, id: item.bar_id, type: 'bar' as const })),
    ];
    
    const clickedItem = items.find(item => item.id === id && item.type === type);
    if (!clickedItem) return;

    const clickedZIndex = clickedItem.zindex;

    if (clickedZIndex < largestZIndex.current) {
      if (largestZIndex.current < maxZIndex.current) {
        const newZIndex = largestZIndex.current + 1;
        largestZIndex.current = newZIndex;
        await updateZIndex(id, newZIndex, type);
      } else if (largestZIndex.current === maxZIndex.current) {
        for (const item of items) {
          if (item.zindex >= clickedZIndex) {
            const newZIndex = item.zindex - 1;
            console.log(`New zindex: ${newZIndex}`);
            await updateZIndex(item.id, newZIndex, item.type);
          }
        }
        await updateZIndex(id, maxZIndex.current, type);
      } else if (largestZIndex.current > maxZIndex.current) {
        console.log('triggered debug');
        for (const item of items) {
          if (item.zindex >= 5000001) {
            const newZIndex = item.zindex - 1;
            console.log(`New zindex: ${newZIndex}`);
            await updateZIndex(item.id, newZIndex, item.type);
          } 
        }
        largestZIndex.current = maxZIndex.current;
        await updateZIndex(id, maxZIndex.current, type);
      }
    } else if (clickedZIndex > largestZIndex.current) {
      console.log('triggered debug');
      if (clickedZIndex == maxZIndex.current) {
        largestZIndex.current = maxZIndex.current;
      } else if (clickedZIndex < maxZIndex.current) {
        largestZIndex.current = clickedZIndex;
      } else if (clickedZIndex > maxZIndex.current) {
        for (const item of items) {
          if (item.zindex >= 5000001) {
            const newZIndex = item.zindex - 1;
            console.log(`New zindex: ${newZIndex}, previous zindex ${item.zindex}`);
            await updateZIndex(item.id, newZIndex, item.type);
          } 
        }
        largestZIndex.current = maxZIndex.current;
        await updateZIndex(id, maxZIndex.current, type);
      }
    } else if (clickedZIndex == largestZIndex.current) {
      if (largestZIndex.current > maxZIndex.current) {
        console.log('triggered debug');
        for (const item of items) {
          if (item.zindex >= 5000001) {
            const newZIndex = item.zindex - 1;
            console.log(`New zindex: ${newZIndex}`);
            await updateZIndex(item.id, newZIndex, item.type);
          } 
        }
        largestZIndex.current = maxZIndex.current;
        await updateZIndex(id, maxZIndex.current, type);
      }
    }

    await fetchTaskLists();
    await fetchBars();

    
  };

  const updateZIndex = async (id: number, zIndex: number, type: 'taskList' | 'bar') => {
    const url = type === 'taskList'
      ? `http://localhost:8000/api/tasklists/${id}/update_lists/`
      : `http://localhost:8000/api/bars/${id}/update_bar/`;
    try {
      await axios.put(url, { zindex: zIndex });
    } catch (error) {
      console.error('Error updating z-index:', error);
    }
    console.log(`put: ${zIndex}`);
    console.log(`max: ${maxZIndex.current}`);
    console.log(`largest: ${largestZIndex.current}`);
  };

  useEffect(() => {
    fetchTaskLists();
    fetchBars();
  }, []);
  
  const handleListDeletion = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/tasklists/${id}/`);
      setTaskLists((prevTaskLists) => prevTaskLists.filter((list) => list.list_id !== id));
    } catch (error) {
      console.error('Error deleting task list:', error);
    }
  };

  const handleBarDeletion = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/bars/${id}/`);
      setBarsData((prevBars) => prevBars.filter((bar) => bar.bar_id !== id));
    } catch (error) {
      console.error('Error deleting bar:', error);
    }
  };

  const handleRenameList = (id: number) => {
    const windowToUpdate = windows.find(w => w.id === id);
    if (windowToUpdate) {
      setRenamePopup({ isOpen: true, id, endpoint: 'tasklists', defaultValue: windowToUpdate.title });
    } else {
      console.error(`List with id ${id} not found.`);
    }
  };

  const handleRenameBar = (id: number) => {
    const barToUpdate = bars.find(w => w.id === id);
    if (barToUpdate) {
      setRenamePopup({ isOpen: true, id, endpoint: 'bars', defaultValue: barToUpdate.title });
    } else {
      console.error(`Bar with id ${id} not found.`);
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

  useEffect(() => {
    if (barsData.length > 0) {
      const newBars = barsData.map((barsData) => ({
        id: barsData.bar_id,
        title: barsData.bar_name,
        initialX: barsData.x_axis,
        initialY: barsData.y_axis,
        initialWidth: barsData.size_horizontal,
        initialHeight: barsData.size_vertical,
        zIndex: barsData.zindex,
      }));
      setBars(newBars);
    }
  }, [taskLists]);

  const handleSaveRename = async (id: number, newName: string, endpoint: string) => {

    if (endpoint === 'taskList') {
      try {
        await axios.put(`http://localhost:8000/api/${endpoint}/${id}/update_name/`, { list_name: newName });
        await fetchTaskLists();
      } catch (error) {
        console.error('Error renaming task list or fetching updated task lists:', error);
      }
    } else if (endpoint === 'bars') {
      try {
        await axios.put(`http://localhost:8000/api/${endpoint}/${id}/update_name/`, { bar_name: newName });
        await fetchBars();
      } catch (error) {
        console.error('Error renaming bar or fetching updated bar:', error);
      }
    }
  };

  const handleCreateCurrency = async () => {
    setCreateCurrencyPopup({ isOpen: true, defaultValue: 'New Currency' });
  };

  const handleSaveNewCurrency = async (newName: string) => {
      try {
        await axios.post(`http://localhost:8000/api/currencies/create_currency/`, { currency_name: newName });
        await fetchCurrencies();
      } catch (error) {
        console.error('Error renaming task list or fetching updated task lists:', error);
      }

  };

  const handleCreateNewList = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/tasklists/', {});
      const newList: TaskList = response.data;

      setTaskLists((prevTaskLists) => [...prevTaskLists, newList]);

      setRenamePopup({ isOpen: true, id: newList.list_id, endpoint: 'tasklists', defaultValue: newList.list_name || 'New List' });
    } catch (error) {
      console.error('Error creating new task list:', error);
    }
  };

  const handleDragWindow = (id: number, x: number, y: number, type: string) => {
    if (type === 'taskList') {
      setTaskLists((prevTaskLists) =>
        prevTaskLists.map((taskList) =>
          taskList.list_id === id ? { ...taskList, x_axis: x, y_axis: y } : taskList
        )
      );
    } else if (type === 'bars') {
      setBarsData((prevBarsData) =>
        prevBarsData.map((bar) =>
          bar.bar_id === id ? { ...bar, x_axis: x, y_axis: y } : bar
        )
      );
    }
  };

  const handleResizeWindow = (id: number, width: number, height: number, type: string) => {
    if (type === 'taskList') {
      setTaskLists((prevTaskLists) =>
        prevTaskLists.map((taskList) =>
          taskList.list_id === id
            ? { ...taskList, size_horizontal: width, size_vertical: height }
            : taskList
        )
      );
    } else if (type === 'bars') {
      setBarsData((prevBarsData) =>
        prevBarsData.map((bar) =>
          bar.bar_id === id
            ? { ...bar, size_horizontal: width, size_vertical: height }
            : bar
        )
      );
    }
  };

  const handleCreateNewBar = () => {
    setIsCreateBarPopupOpen(true);
  };

  const handleConfirmNewBar = async (
    barName: string, 
    xpName: string, 
    fullCycle: number, 
    partialCycle1: number | null, 
    partialCycle2: number | null, 
    partialCycle3: number | null,
    transactions: { [currencyId: number]: number }
  ) => {
    try {
      const requestBody = {
        bar_name: barName,
        xp_name: xpName,
        full_cycle: fullCycle,
        partial_cycle1: partialCycle1,
        partial_cycle2: partialCycle2,
        partial_cycle3: partialCycle3,
      };
  
      // Make a POST request to the API endpoint
      const response = await axios.post('http://localhost:8000/api/bars/create_bar/', requestBody);
  
      // Assuming the response indicates success or contains new data, handle accordingly
      console.log('Successfully created bar:', response.data);

      const barId = response.data.bar_id;

      const transactionPromises = Object.entries(transactions).map(([currencyId, amount]) => {
        if (amount !== 0) {
          const transactionPayload = {
            bar_id: barId,
            currency_id: parseInt(currencyId, 10),
            amount
          };
          console.log('Transaction Payload:', transactionPayload);
          return axios.post('http://localhost:8000/api/transactions/create_transaction/', transactionPayload);
        }
        return null;
      }).filter(promise => promise !== null);

      await Promise.all(transactionPromises);

      fetchBars();
      fetchTransactions();
  
      setIsCreateBarPopupOpen(false); // Close the popup after creating the new bar
    } catch (error) {
      console.error('Error creating new bar:', error);
      // Handle error, such as displaying an error message to the user
    }
  };

  const [isCreateBarPopupOpen, setIsCreateBarPopupOpen] = useState(false);

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
        {isSidebarVisible && <Sidebar 
          onReturnHome={onReturnHome} 
          onCreateNewList={handleCreateNewList} 
          onCompleteTasks={handleCompleteTasks}
          onCreateNewBar={handleCreateNewBar}
        />}
        <ResetButton onClick={handleReset} />
        <div className={styles.currencies}>
          <Currencies 
            currencies={currencies}
            onCreateNewCurrency={handleCreateCurrency}
          /> 
        </div>
        {taskLists.map((taskList) => (
          <div key={taskList.list_id} className={`${styles.window} window`}>
          <Window 
            id={taskList.list_id} 
            title={taskList.list_name}
            initialX={taskList.x_axis}
            initialY={taskList.y_axis}
            initialWidth={taskList.size_horizontal}
            initialHeight={taskList.size_vertical}
            translate={translate} 
            scale={scale} 
            zIndex={taskList.zindex}
            rewards={rewards}
            transactions={transactions}
            barsData={barsData}
            currencies={currencies}
            detailView={taskList.detail_view}
            onClose={handleCloseWindow} 
            onRename={handleRenameList}
            onClick={() => bringItemToFront(taskList.list_id, 'taskList')}
            onDrag={handleDragWindow}
            onResize={handleResizeWindow}
            onPositionUpdate={(id, x, y) => handleDragWindow(id, x, y, 'taskList')}
            onSizeUpdate={(id, width, height) => handleResizeWindow(id, width, height, 'taskList')}
            
            checkedTasks={checkedTasks}
            toggleTaskChecked={toggleTaskChecked}
            openPopup={openPopup}
            registerTaskUpdateCallback={registerTaskUpdateCallback}
          />
          </div>
        ))}
        {barsData.map((bar) => (
          <div key={bar.bar_id} className={`${styles.bar} bar`}>
            <Bar
              id={bar.bar_id}
              title={bar.bar_name}
              initialX={bar.x_axis}
              initialY={bar.y_axis}
              initialWidth={bar.size_horizontal}
              initialHeight={bar.size_vertical}
              translate={translate} 
              scale={scale} 
              currencies={currencies}
              transactions={transactions}
              zIndex={bar.zindex}
              onClose={handleCloseBar}
              onRename={handleRenameBar}
              onClick={() => bringItemToFront(bar.bar_id, 'bar')}
              onDrag={handleDragWindow}
              onResize={handleResizeWindow}
              onPositionUpdate={(id, x, y) => handleDragWindow(id, x, y, 'bars')}
              onSizeUpdate={(id, width, height) => handleResizeWindow(id, width, height, 'bars')}
              total_points={bar.total_points}
              full_cycle={bar.full_cycle}
              xp_name={bar.xp_name}     
            />
          </div>
        ))}
        {createCurrencyPopup.isOpen && (
          <CreateCurrencyPopup
            isOpen={createCurrencyPopup.isOpen}
            defaultValue={createCurrencyPopup.defaultValue}
            onCreate={handleSaveNewCurrency}
            onQuit={() => setCreateCurrencyPopup({ isOpen: false, defaultValue: '' })}
          />
        )}
        {renamePopup.isOpen && (
          <RenamePopup
            isOpen={renamePopup.isOpen}
            id={renamePopup.id}
            endpoint={renamePopup.endpoint}
            defaultValue={renamePopup.defaultValue}
            onSave={handleSaveRename}
            onClose={() => setRenamePopup({ isOpen: false, id: null, endpoint: '', defaultValue: '' })}
          />
        )}
        {isPopupOpen && (
          <CreateTaskPopup
            onClose={closePopup}
            onConfirm={handleConfirm}
            bars={barsData}
            currencies={currencies}
          />
        )}
        {isCreateBarPopupOpen && (
          <CreateBarPopup
            onClose={() => setIsCreateBarPopupOpen(false)}
            onConfirm={handleConfirmNewBar}
            currencies={currencies}
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
