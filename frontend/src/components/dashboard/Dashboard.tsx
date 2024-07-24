import React, { useContext, useState, useRef, useEffect, MouseEvent } from 'react';
import { ThemeContext } from '../../context/ThemeContext';
import Sidebar from '../sidebar/Sidebar';
import ResetButton from '../sidebar/ResetButton';
import styles from './dashboard.module.css';
import ToggleButton from '../sidebar/ToggleButton';
import Window from './Window';
import Bar from './Bar';
import Shop from './Shop';
import Currencies from './Currencies';
import Items from './Items';
import CreateListPopup from '../popups/CreateListPopup';
import CreateTaskPopup from '../popups/CreateTaskPopup';
import CreateBarPopup from '../popups/CreateBarPopup';
import CreateCurrencyPopup from '../popups/CreateCurrencyPopup';
import CreateItemPopup from '../popups/CreateItemPopup';
import axios from 'axios';

interface Layer {
  layer_id: number;
  layer: number;
  foreign_table: number;
  foreign_id: number;
}

interface TaskList {
  list_id: number;
  list_name: string;
  x_axis: number;
  y_axis: number;
  size_horizontal: number;
  size_vertical: number;
  layer: Layer;
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
  layer: Layer;
  full_cycle: number;
  total_points: number;
}

interface ShopData {
  shop_id: number;
  shop_name: string;
  x_axis: number;
  y_axis: number;
  size_horizontal: number;
  size_vertical: number;
  layer: Layer;
}

interface Currency {
  currency_id: number;
  currency_name: string;
  owned: number;
}

interface Item {
  item_id: number;
  item_name: string;
  storage: number;
}

interface Task {
  task_id: number;
  task_name: string;
  rewards: { [barId: number]: number };
  transactions: { [currencyId: number]: number };
  vouchers: { [itemId: number]: number };
}

interface CreateCurrencyState {
  isOpen: boolean;
  defaultValue: string;
  isEditMode: boolean;
  currencyId: number | undefined;
}

interface CreateItemState {
  isOpen: boolean;
  defaultValue: string;
  isEditMode: boolean;
  itemId: number | undefined;
}

interface CreateListPopupState {
  isOpen: boolean;
  id: number | null;
  defaultValue: string;
  defaultX: number;
  defaultY: number;
  defaultWidth: number;
  defaultHeight: number;
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

interface Bar extends BarData {
  transactions: { [currencyId: number]: number };
  vouchers: { [itemId: number]: number },
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

interface Transaction {
  transaction_id: number;
  bar: number;
  task: number;
  currency: number;
  amount: number;
}

interface Voucher {
  voucher_id: number;
  bar: number;
  task: number;
  item: number;
  quantity: number;
}

interface Price {
  price_id: number;
  currency: number;
  item: number;
  shop: number;
  cost: number;
}

interface Reward {
  reward_id: number;
  bar: number;
  task: number;
  points: number;
}

interface StateItem {
  id: number;
  layer: number;
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
  const [createCurrencyPopup, setCreateCurrencyPopup] = useState<CreateCurrencyState>({ isOpen: false, defaultValue: '', isEditMode: false, currencyId: undefined, });
  const [createItemPopup, setCreateItemPopup] = useState<CreateItemState>({ isOpen: false, defaultValue: '', isEditMode: false, itemId: undefined});
  const [createListPopup, setCreateListPopup] = useState<CreateListPopupState>({ isOpen: false, id: null, defaultValue: '', defaultX: 0, defaultY: 0, defaultWidth: 300, defaultHeight: 200 });
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [barsData, setBarsData] = useState<BarData[]>([]);
  const [shopsData, setShopsData] = useState<ShopData[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);
  const [nest, setNest] = useState<number | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<number[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [prices, setPrices] = useState<Price[]>([])
  const [isEditMode, setIsEditMode] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const [isCreateBarPopupOpen, setIsCreateBarPopupOpen] = useState(false);
  const [barToEdit, setBarToEdit] = useState<Bar | null>(null);
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
      fetchTaskLists();
      fetchItems();
    } catch (error) {
      console.error('Error deleting tasks:', error);
    }
  };

  const openPopup = (windowId: number, nest_id: number | null, editMode = false, task = null) => {
    setCurrentWindowId(windowId);
    setNest(nest_id);
    setIsEditMode(editMode);
    setTaskToEdit(task || undefined);
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

  const fetchVouchers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/vouchers/');
      setVouchers(response.data);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
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

  const fetchItems = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/items/');
      setItems(response.data); // Assuming the response.data is an array of currencies
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };

  const fetchPrices = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/prices/');
      setPrices(response.data);
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };
  
  useEffect(() => {
    fetchItems();
    fetchCurrencies();
    fetchTransactions();
    fetchRewards();
    fetchVouchers();
    fetchTaskLists();
    fetchBars();
    fetchShops();
  }, []);

  const handleConfirm = async (
    taskId: number,
    taskName: string,
    newRewards: { [barId: number]: number },
    newTransactions: { [currencyId: number]: number },
    newVouchers: { [itemId: number]: number },
  ) => {    
    if (isEditMode && taskToEdit) {
      await handleUpdate(taskId, taskName, newRewards, newTransactions, newVouchers);
    } else {
      await handleCreate(taskName, newRewards, newTransactions, newVouchers);
    }
    closePopup();
    if (currentWindowId !== null && currentWindowId in taskUpdateCallbacks.current) {
      taskUpdateCallbacks.current[currentWindowId]();
    }
    fetchRewards();
    fetchTransactions();
    fetchVouchers();
  };

  const handleUpdate = async (
    taskId: number,
    taskName: string,
    newRewards: { [barId: number]: number },
    newTransactions: { [currencyId: number]: number },
    newVouchers: { [itemId: number]: number },
  ) => {
    try {
      // Step 1: Update the task
      const taskPayload = {
        task_name: taskName,
        nested_id: nest, // Assuming 'nest' is defined in the scope
      };
  
      console.log('Update Task Payload:', taskPayload);
  
      await axios.patch(`http://localhost:8000/api/tasks/${taskId}/update_task/`, taskPayload);
      console.log('Task updated successfully');
  
      // Step 2: Update or delete existing rewards
      const rewardPromises = rewards.map(async (reward) => {
        const points = newRewards[reward.bar] || 0;
  
        if (reward.task === taskId) {
          if (points > 0) {
            // Update existing reward
            const rewardPayload = {
              task_id: taskId,
              bar_id: reward.bar,
              points,
            };
            console.log('Update Reward Payload:', rewardPayload);
            return axios.patch(`http://localhost:8000/api/rewards/${reward.reward_id}/`, rewardPayload);
          } else {
            // Delete existing reward
            console.log('Delete Reward:', reward.reward_id);
            return axios.delete(`http://localhost:8000/api/rewards/${reward.reward_id}/`);
          }
        }
        return null; // Ignore rewards not associated with taskId
      });
  
      // Create new rewards
      Object.entries(newRewards).forEach(([barId, points]) => {
        if (points > 0 && !rewards.find(reward => reward.task === taskId && reward.bar === parseInt(barId, 10))) {
          const rewardPayload = {
            task_id: taskId,
            bar_id: parseInt(barId, 10),
            points,
          };
          console.log('Create Reward Payload:', rewardPayload);
          rewardPromises.push(axios.post(`http://localhost:8000/api/rewards/create_reward/`, rewardPayload));
        }
      });
  
      // Step 3: Update or delete existing transactions
      const transactionPromises = transactions.map(async (transaction) => {
        const amount = newTransactions[transaction.currency] || 0;
  
        if (transaction.task === taskId) {
          if (amount !== 0) {
            // Update existing transaction
            const transactionPayload = {
              task_id: taskId,
              currency_id: transaction.currency,
              amount,
            };
            console.log('Update Transaction Payload:', transactionPayload);
            return axios.patch(`http://localhost:8000/api/transactions/${transaction.transaction_id}/`, transactionPayload);
          } else {
            // Delete existing transaction
            console.log('Delete Transaction:', transaction.transaction_id);
            return axios.delete(`http://localhost:8000/api/transactions/${transaction.transaction_id}/`);
          }
        }
        return null; // Ignore transactions not associated with taskId
      });
  
      // Create new transactions
      Object.entries(newTransactions).forEach(([currencyId, amount]) => {
        if (amount !== 0 && !transactions.find(transaction => transaction.task === taskId && transaction.currency === parseInt(currencyId, 10))) {
          const transactionPayload = {
            task_id: taskId,
            currency_id: parseInt(currencyId, 10),
            amount,
          };
          console.log('Create Transaction Payload:', transactionPayload);
          transactionPromises.push(axios.post(`http://localhost:8000/api/transactions/create_transaction/`, transactionPayload));
        }
      });

      // Step 4: Update or delete existing vouchers
      const voucherPromises = vouchers.map(async (voucher) => {
        const quantity = newVouchers[voucher.item] || 0;
  
        if (voucher.task === taskId) {
          if (quantity !== 0) {
            // Update existing transaction
            const voucherPayload = {
              task_id: taskId,
              item_id: voucher.item,
              quantity,
            };
            console.log('Update Voucher Payload:', voucherPayload);
            return axios.patch(`http://localhost:8000/api/vouchers/${voucher.voucher_id}/`, voucherPayload);
          } else {
            // Delete existing vouchers
            console.log('Delete Transaction:', voucher.voucher_id);
            return axios.delete(`http://localhost:8000/api/vouchers/${voucher.voucher_id}/`);
          }
        }
        return null; // Ignore vouchers not associated with taskId
      });
  
      // Create new vouchers
      Object.entries(newVouchers).forEach(([itemId, quantity]) => {
        if (quantity !== 0 && !vouchers.find(voucher => voucher.task === taskId && voucher.item === parseInt(itemId, 10))) {
          const voucherPayload = {
            task_id: taskId,
            item_id: parseInt(itemId, 10),
            quantity,
          };
          console.log('Create Vouchers Payload:', voucherPayload);
          voucherPromises.push(axios.post(`http://localhost:8000/api/vouchers/create_voucher/`, voucherPayload));
        }
      });
  
      // Combine reward and transaction promises
      const allPromises = [...rewardPromises, ...transactionPromises, ...voucherPromises].filter(promise => promise !== null);
  
      // Execute all update requests
      await Promise.all(allPromises);
  
      console.log('Rewards and transactions updated successfully');
    } catch (error) {
      console.error('Error updating task, rewards, or transactions:', error);
    }
    closePopup();
    fetchVouchers();
    fetchTransactions();
    fetchRewards();
  };

  const handleCreate = async (
    taskName: string,
    rewards: { [barId: number]: number },
    transactions: { [currencyId: number]: number },
    vouchers: { [itemId: number]: number },
  ) => {
    try {
      if (currentWindowId === null) return;
  
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

      // Step 4: Create voucher for each currency with assigned amount
      const voucherPromises = Object.entries(vouchers).map(([itemId, quantity]) => {
        if (quantity !== 0) {
          const voucherPayload = {
            task_id: taskId,
            item_id: parseInt(itemId, 10),
            quantity
          };
          console.log('Voucher Payload:', voucherPayload);
          return axios.post('http://localhost:8000/api/vouchers/create_voucher/', voucherPayload);
        }
        return null;
      }).filter(promise => promise !== null);
  
      // Combine reward and transaction promises
      const allPromises = [...rewardPromises, ...transactionPromises, ...voucherPromises];
  
      // Execute all creation requests
      await Promise.all(allPromises);
  
      console.log('Rewards and transactions created successfully');
    } catch (error) {
      console.error('Error creating task, rewards, or transactions:', error);
    }
  };

  const fetchTaskLists = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/tasklists/');
      const fetchedTaskLists: TaskList[] = response.data;
      const sortedTaskLists = fetchedTaskLists.sort((a, b) => a.layer.layer - b.layer.layer);
      setTaskLists(sortedTaskLists);
    } catch (error) {
      console.error('Error fetching task lists:', error);
    }
  };
  
  const fetchBars = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/bars/');
      const fetchedBars: BarData[] = response.data;
      const sortedBars = fetchedBars.sort((a, b) => a.layer.layer - b.layer.layer);
      setBarsData(sortedBars);
    } catch (error) {
      console.error('Error fetching bars:', error);
    }
  };
  
  const fetchShops = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/shops/');
      const fetchedShops: ShopData[] = response.data;
      const sortedShops = fetchedShops.sort((a, b) => a.layer.layer - b.layer.layer);
      setShopsData(sortedShops);
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  type UpdateStateFunction = (id: number, updatedLayer: number) => void;

  const optimisticUpdate = async (
    foreignId: number,
    foreignTable: number,
    updateState: UpdateStateFunction,
    previousLayer: number
  ) => {
    // Immediately update the UI
    updateState(foreignId, 6000000);
  
    // Revert changes if the server update fails
    return await axios.post('http://localhost:8000/api/layers/move_to_highest/', {
      foreign_id: foreignId,
      foreign_table: foreignTable
    }).catch((error) => {
      console.error('Error moving item to highest:', error);
      // Revert the state update on error
      updateState(foreignId, previousLayer);
    });
  };

  const updateState = (
    foreignTable: number,
    id: number,
    newLayer: number,
    previousLayer: number
  ) => {
    switch (foreignTable) {
      case 1:
        setTaskLists(prevLists => 
          prevLists.map(list =>
            list.list_id === id
              ? { ...list, layer: { ...list.layer, layer: newLayer } }
              : list
          )
        );
      break;
      case 2:
        setBarsData(prevBars =>
          prevBars.map(bar =>
            bar.bar_id === id
              ? { ...bar, layer: { ...bar.layer, layer: newLayer } }
              : bar
          )
        );
      break;
      case 3:
        setShopsData(prevShops =>
          prevShops.map(shop =>
            shop.shop_id === id
              ? { ...shop, layer: { ...shop.layer, layer: newLayer } }
              : shop
          )
        );
      break;
      default:
        console.error('Invalid foreign_table value:', foreignTable);
    }
  };
  
  const moveItemToHighestLayer = async (foreignId: number, foreignTable: number) => {
    // Find the previous layer value based on foreignTable
    let previousLayer: number;
  
    switch (foreignTable) {
      case 1:
        previousLayer = taskLists.find(list => list.list_id === foreignId)?.layer.layer || 0;
        break;
      case 2:
        previousLayer = barsData.find(bar => bar.bar_id === foreignId)?.layer.layer || 0;
        break;
      case 3:
        previousLayer = shopsData.find(shop => shop.shop_id === foreignId)?.layer.layer || 0;
        break;
      default:
        console.error('Invalid foreign_table value:', foreignTable);
        return;
    }
  
    // Perform optimistic update
    const revertLayer = optimisticUpdate(
      foreignId,
      foreignTable,
      (id, newLayer) => updateState(foreignTable, id, newLayer, previousLayer),
      previousLayer
    );
  
    try {
      await revertLayer;  // Wait for the revert logic to complete
      // Fetch updated data if necessary
      fetchBars();
      fetchTaskLists();
      fetchShops();
    } catch (error) {
      console.error('Error during optimistic update:', error);
    }
  };
  
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

  const handleItemDeletion = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/items/${id}/`);
      setItems((prevItems) => prevItems.filter((item) => item.item_id !== id));
    } catch (error) {
      console.error('Error deleting task list:', error);
    }
    fetchItems();
  };

  const handleCurrencyDeletion = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/currencies/${id}/`);
      setCurrencies((prevCurrencies) => prevCurrencies.filter((currency) => currency.currency_id !== id));
    } catch (error) {
      console.error('Error deleting task list:', error);
    }
    fetchCurrencies();
  };

  const handleCreateCurrency = () => {
    setCreateCurrencyPopup({
      isOpen: true,
      defaultValue: '',
      isEditMode: false,
      currencyId: undefined,
    });
  };

  const handleEditCurrency = (currencyId: number, currencyName: string) => {
    setCreateCurrencyPopup({
      isOpen: true,
      defaultValue: currencyName,
      isEditMode: true,
      currencyId: currencyId,
    });
  };

  const handleCreateItem = async () => {
    setCreateItemPopup({ 
      isOpen: true,
      defaultValue: '',
      isEditMode: false,
      itemId: undefined, 
    });
  };

  const handleEditItem = (itemId: number, itemName: string) => {
    setCreateItemPopup({
      isOpen: true,
      defaultValue: itemName,
      isEditMode: true,
      itemId: itemId,
    });
  };

  const handleSaveNewCurrency = async (newName: string) => {
    try {
      await axios.post(`http://localhost:8000/api/currencies/create_currency/`, { currency_name: newName });
      await fetchCurrencies();
    } catch (error) {
      console.error('Error creating currency:', error);
    }
  };

  const handleSaveNewItem = async (newName: string) => {
    try {
      await axios.post(`http://localhost:8000/api/items/create_item/`, { item_name: newName });
      await fetchItems();
    } catch (error) {
      console.error('Error creating item:', error);
    }
  };

  const handleUpdateCurrency = async (currencyId: number, newName: string) => {
    try {
      await axios.patch(`http://localhost:8000/api/currencies/${currencyId}/`, { currency_name: newName });
      await fetchCurrencies();
    } catch (error) {
      console.error('Error creating currency:', error);
    }
  };

  const handleUpdateItem = async (itemId: number, newName: string) => {
    try {
      await axios.patch(`http://localhost:8000/api/items/${itemId}/`, { item_name: newName });
      await fetchItems();
    } catch (error) {
      console.error('Error creating currency:', error);
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
    } else if (type === 'shops') {
      setShopsData((prevShopsData) =>
        prevShopsData.map((shop) =>
          shop.shop_id === id ? { ...shop, x_axis: x, y_axis: y } : shop
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
    } else if (type === 'shops') {
      setShopsData((prevShopsData) =>
        prevShopsData.map((shop) =>
          shop.shop_id === id
            ? { ...shop, size_horizontal: width, size_vertical: height }
            : shop
        )
      );
    }
  };

  const handleCreateNewBar = () => {
    setIsCreateBarPopupOpen(true);
    setIsEditMode(false);
    setBarToEdit(null);
  };

  const handleConfirmNewBar = async (
    barName: string,
    xpName: string,
    fullCycle: number,
    sizeVertical: number,
    sizeHorizontal: number,
    xAxis: number,
    yAxis: number,
    transactions: { [currencyId: number]: number },
    vouchers: { [itemId: number]: number },
  ) => {
    try {
      const requestBody = {
        bar_name: barName,
        xp_name: xpName,
        full_cycle: fullCycle,
        size_vertical: sizeVertical,
        size_horizontal: sizeHorizontal,
        x_axis: xAxis,
        y_axis: yAxis,
      };

      // Make a POST request to create a new bar
      const response = await axios.post('http://localhost:8000/api/bars/create_bar/', requestBody);
      console.log('Successfully created bar:', response.data);

      const barId = response.data.bar_id;

      // Process transactions associated with the new bar
      const transactionPromises = Object.entries(transactions).map(([currencyId, amount]) => {
        if (amount !== 0) {
          const transactionPayload = {
            bar_id: barId,
            currency_id: parseInt(currencyId, 10),
            amount,
          };
          console.log('Transaction Payload:', transactionPayload);
          return axios.post('http://localhost:8000/api/transactions/create_transaction/', transactionPayload);
        }
        return null;
      }).filter(promise => promise !== null);

      const voucherPromises = Object.entries(vouchers).map(([itemId, quantity]) => {
        if (quantity !== 0) {
          const voucherPayload = {
            bar_id: barId,
            item_id: parseInt(itemId, 10),
            quantity,
          };
          console.log('Voucher Payload:', voucherPayload);
          return axios.post('http://localhost:8000/api/vouchers/create_voucher/', voucherPayload);
        }
        return null;
      }).filter(promise => promise !== null);

      // Combine voucher and transaction promises
      const allPromises = [...voucherPromises, ...transactionPromises];
  
      // Execute all creation requests
      await Promise.all(allPromises);

      // Refresh data after successful creation
      fetchBars();
      fetchTransactions();
      fetchVouchers();

      setIsCreateBarPopupOpen(false); // Close the popup after creating the new bar
    } catch (error) {
      console.error('Error creating new bar:', error);
      // Handle error, such as displaying an error message to the user
    }
  };

  const handleEditBar = async (id: number) => {
    const barToUpdate = barsData.find(bar => bar.bar_id === id);
    if (barToUpdate) {
      // Find transactions for the specific bar from the fetched transactions
      const transactionsForBar = transactions.filter(transaction => transaction.bar === id);
      const vouchersForBar = vouchers.filter(voucher => voucher.bar === id);

      setIsCreateBarPopupOpen(true);
      setIsEditMode(true);
      setBarToEdit({
        ...barToUpdate,
        transactions: transactionsForBar.reduce((acc, transaction) => {
          acc[transaction.currency] = transaction.amount;
          return acc;
        }, {} as { [currencyId: number]: number }),
        vouchers: vouchersForBar.reduce((acc, voucher) => {
          acc[voucher.item] = voucher.quantity;
          return acc;
        }, {} as { [itemId: number]: number }),
      });
    } else {
      console.error(`Bar with id ${id} not found.`);
    }
  };

  const handleUpdateBar = async (
    barId: number,
    barName: string,
    xpName: string,
    fullCycle: number,
    sizeVertical: number,
    sizeHorizontal: number,
    xAxis: number,
    yAxis: number,
    newTransactions: { [currencyId: number]: number },
    newVouchers: { [itemId: number]: number },
  ) => {
    try {
      const requestBody = {
        bar_id: barId,
        bar_name: barName,
        xp_name: xpName,
        full_cycle: fullCycle,
        size_vertical: sizeVertical,
        size_horizontal: sizeHorizontal,
        x_axis: xAxis,
        y_axis: yAxis,
      };

      setBarsData(prevBarsData => prevBarsData.map(bar => 
        bar.bar_id === barId ? { ...bar, ...requestBody } : bar
      ));

      // Step 1: Update the bar
      await axios.put(`http://localhost:8000/api/bars/${barId}/update_bar/`, requestBody);
      console.log('Bar updated successfully');

      // Step 2: Update or delete existing transactions
      const transactionPromises = transactions.map(async (transaction) => {
        const amount = newTransactions[transaction.currency] || 0;

        if (transaction.bar === barId) {
          if (amount !== 0) {
            // Update existing transaction
            const transactionPayload = {
              bar_id: barId,
              currency_id: transaction.currency,
              amount,
            };
            console.log('Update Transaction Payload:', transactionPayload);
            return axios.patch(`http://localhost:8000/api/transactions/${transaction.transaction_id}/`, transactionPayload);
          } else {
            // Delete existing transaction
            console.log('Delete Transaction:', transaction.transaction_id);
            return axios.delete(`http://localhost:8000/api/transactions/${transaction.transaction_id}/`);
          }
        }
        return null; // Ignore transactions not associated with barId
      });

      // Create new transactions
      Object.entries(newTransactions).forEach(([currencyId, amount]) => {
        if (amount !== 0 && !transactions.find(transaction => transaction.bar === barId && transaction.currency === parseInt(currencyId, 10))) {
          const transactionPayload = {
            bar_id: barId,
            currency_id: parseInt(currencyId, 10),
            amount,
          };
          console.log('Create Transaction Payload:', transactionPayload);
          transactionPromises.push(axios.post(`http://localhost:8000/api/transactions/create_transaction/`, transactionPayload));
        }
      });

      const voucherPromises = vouchers.map(async (voucher) => {
        const quantity = newVouchers[voucher.item] || 0;

        if (voucher.bar === barId) {
          if (quantity !== 0) {
            // Update existing vouchers
            const voucherPayload = {
              bar_id: barId,
              item_id: voucher.item,
              quantity,
            };
            console.log('Update Voucher Payload:', voucherPayload);
            return axios.patch(`http://localhost:8000/api/vouchers/${voucher.voucher_id}/`, voucherPayload);
          } else {
            // Delete existing vouchers
            console.log('Delete Voucher:', voucher.voucher_id);
            return axios.delete(`http://localhost:8000/api/vouchers/${voucher.voucher_id}/`);
          }
        }
        return null; // Ignore vouchers not associated with barId
      });

      Object.entries(newVouchers).forEach(([itemId, quantity]) => {
        if (quantity !== 0 && !vouchers.find(voucher => voucher.bar === barId && voucher.item === parseInt(itemId, 10))) {
          const voucherPayload = {
            bar_id: barId,
            item_id: parseInt(itemId, 10),
            quantity,
          };
          console.log('Create Voucher Payload:', voucherPayload);
          voucherPromises.push(axios.post(`http://localhost:8000/api/vouchers/create_voucher/`, voucherPayload));
        }
      });

      // Combine voucher and transaction promises
      const allPromises = [...voucherPromises, ...transactionPromises];
  
      // Execute all creation requests
      await Promise.all(allPromises);
      console.log('Transactions updated successfully');

      // Step 3: Refresh data
      fetchBars();
      fetchTransactions();
      fetchVouchers();

      setIsCreateBarPopupOpen(false); // Close the popup after updating the bar
    } catch (error) {
      console.error('Error updating bar or transactions:', error);
      // Handle error, such as displaying an error message to the user
    }
  };

  const handleCreateNewList = async () => {
    setCreateListPopup({
      isOpen: true,
      id: null,
      defaultValue: '',
      defaultX: 0,
      defaultY: 0,
      defaultWidth: 300,
      defaultHeight: 200,
    });
  };

  const handleEditList = (id: number, defaultValue: string, x: number, y: number, width: number, height: number) => {
    setCreateListPopup({
      isOpen: true,
      id,
      defaultValue,
      defaultX: x,
      defaultY: y,
      defaultWidth: width,
      defaultHeight: height,
    });
  };

  const handleSaveList = async (id: number | null, newName: string, x: number, y: number, width: number, height: number) => {
    try {
      if (id === null) {
        // Create new list
        const response = await axios.post('http://localhost:8000/api/tasklists/', {
          list_name: newName,
          x_axis: x,
          y_axis: y,
          size_horizontal: width,
          size_vertical: height,
        });
        const newList: TaskList = response.data;
        setTaskLists((prevTaskLists) => [...prevTaskLists, newList]);
      } else {
        // Update existing list
        await axios.patch(`http://localhost:8000/api/tasklists/${id}/`, {
          list_name: newName,
          x_axis: x,
          y_axis: y,
          size_horizontal: width,
          size_vertical: height,
        });
        setTaskLists((prevTaskLists) =>
          prevTaskLists.map((list) =>
            list.list_id === id
              ? { ...list, list_name: newName, x_axis: x, y_axis: y, size_horizontal: width, size_vertical: height }
              : list
          )
        );
      }
      setCreateListPopup({ isOpen: false, id: null, defaultValue: '', defaultX: 0, defaultY: 0, defaultWidth: 300, defaultHeight: 200 });
    } catch (error) {
      console.error('Error saving list:', error);
    }
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
            onDeleteCurrency={handleCurrencyDeletion}
            onEditCurrency={handleEditCurrency}
            onCreateNewCurrency={handleCreateCurrency}
          /> 
        </div>
        <div className={styles.items}>
          <Items 
            items={items}
            onDeleteItem={handleItemDeletion}
            onEditItem={handleEditItem}
            onCreateNewItem={handleCreateItem}
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
            zIndex={taskList.layer.layer}
            rewards={rewards}
            transactions={transactions}
            barsData={barsData}
            currencies={currencies}
            items={items}
            vouchers={vouchers}
            detailView={taskList.detail_view}
            onClose={handleCloseWindow} 
            onRename={(id) => handleEditList(id, taskList.list_name, taskList.x_axis, taskList.y_axis, taskList.size_horizontal, taskList.size_vertical)}
            onClick={() => moveItemToHighestLayer(taskList.list_id, taskList.layer.foreign_table)}
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
              items={items}
              vouchers={vouchers}
              currencies={currencies}
              transactions={transactions}
              zIndex={bar.layer.layer}
              onClose={handleCloseBar}
              onEdit={handleEditBar}
              onClick={() => moveItemToHighestLayer(bar.layer.foreign_id, bar.layer.foreign_table)}
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
        {shopsData.map((shop) => (
          <div key={shop.shop_id} className={`${styles.shop} shop`}>
            <Shop
              id={shop.shop_id}
              title={shop.shop_name}
              initialX={shop.x_axis}
              initialY={shop.y_axis}
              initialWidth={shop.size_horizontal}
              initialHeight={shop.size_vertical}
              translate={translate} 
              scale={scale} 
              prices={prices}
              items={items}
              currencies={currencies}
              zIndex={shop.layer.layer}
              onClose={handleCloseBar}
              onEdit={handleEditBar}
              onClick={() => moveItemToHighestLayer(shop.layer.foreign_id, shop.layer.foreign_table)}
              onDrag={handleDragWindow}
              onResize={handleResizeWindow}
              onPositionUpdate={(id, x, y) => handleDragWindow(id, x, y, 'shops')}
              onSizeUpdate={(id, width, height) => handleResizeWindow(id, width, height, 'shops')}
            />
          </div>
        ))}
        {createCurrencyPopup.isOpen && (
          <CreateCurrencyPopup
            isOpen={createCurrencyPopup.isOpen}
            defaultValue={createCurrencyPopup.defaultValue}
            isEditMode={createCurrencyPopup.isEditMode}
            currencyId={createCurrencyPopup.currencyId}
            onCreate={handleSaveNewCurrency}
            onEdit={handleUpdateCurrency}
            onQuit={() => setCreateCurrencyPopup({ isOpen: false, defaultValue: '', isEditMode: false, currencyId: undefined })}
          />
        )}
        {createItemPopup.isOpen && (
          <CreateItemPopup
            isOpen={createItemPopup.isOpen}
            defaultValue={createItemPopup.defaultValue}
            isEditMode={createItemPopup.isEditMode}
            itemId={createItemPopup.itemId}
            onCreate={handleSaveNewItem}
            onEdit={handleUpdateItem}
            onQuit={() => setCreateItemPopup({ isOpen: false, defaultValue: '', isEditMode: false, itemId: undefined })}
          />
        )}
        {createListPopup.isOpen && (
          <CreateListPopup
            isOpen={createListPopup.isOpen}
            id={createListPopup.id}
            defaultValue={createListPopup.defaultValue}
            defaultX={createListPopup.defaultX}
            defaultY={createListPopup.defaultY}
            defaultWidth={createListPopup.defaultWidth}
            defaultHeight={createListPopup.defaultHeight}
            onSave={handleSaveList}
            onClose={() => setCreateListPopup({ isOpen: false, id: null, defaultValue: '', defaultX: 0, defaultY: 0, defaultWidth: 300, defaultHeight: 200 })}
          />
        )}
        {isPopupOpen && (
          <CreateTaskPopup
            onClose={closePopup}
            onConfirm={handleConfirm}
            onUpdate={handleUpdate}
            transactionsProp={transactions}
            rewardsProp={rewards}
            vouchersProp={vouchers}
            bars={barsData}
            currencies={currencies}
            items={items}
            isEditMode={isEditMode}
            taskToEdit={taskToEdit}
          />
        )}
        {isCreateBarPopupOpen && (
          <CreateBarPopup
            onClose={() => setIsCreateBarPopupOpen(false)}
            onConfirm={handleConfirmNewBar}
            onUpdate={handleUpdateBar}
            currencies={currencies}
            items={items}
            isEditMode={isEditMode}
            barToEdit={barToEdit}
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
