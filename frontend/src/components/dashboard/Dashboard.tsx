import React, { useContext, useState, useRef, useEffect, MouseEvent } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useTranslation } from '../../contexts/TranslationContext';
import Sidebar from '../sidebar/Sidebar';
import ResetButton from '../sidebar/ResetButton';
import styles from './dashboard.module.css';
import ToggleButton from '../sidebar/ToggleButton';
import List from './List';
import Bar from './Bar';
import Shop from './Shop';
import Currencies from './Currencies';
import Items from './Items';
import Duties from './Duties'
import CreateListPopup from '../popups_create/CreateListPopup';
import CreateTaskPopup from '../popups_create/CreateTaskPopup';
import CreatePricePopup from '../popups_create/CreatePricePopup';
import CreateBarPopup from '../popups_create/CreateBarPopup';
import CreateCurrencyPopup from '../popups_create/CreateCurrencyPopup';
import CreateItemPopup from '../popups_create/CreateItemPopup';
import UseItemPopup from '../popups_actions/UseItemPupup';
import axios from 'axios';
import ExchangePopup from '../popups_actions/ExchangePopup';

interface Layer {
  layer_id: number;
  layer: number;
  foreign_table: number;
  foreign_id: number;
}

interface ListData {
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

interface Duty {
  task_id: number;
  task_name: string;
  list_task: number;
  created_date_time: string;
  nested_id: number | null;
  expanded: boolean;
}

interface Currency {
  currency_id: number;
  currency_name: string;
  owned: number;
  exchange_rate: number | null;
  exchange_loss: number;
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

interface Bar extends BarData {
  transactions: { [currencyId: number]: number };
  vouchers: { [itemId: number]: number };
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
  const { requestConfirmation } = useConfirmation();
  const { t } = useTranslation();
  const [scale, setScale] = useState(1);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [createCurrencyPopup, setCreateCurrencyPopup] = useState<CreateCurrencyState>({ isOpen: false, defaultValue: '', isEditMode: false, currencyId: undefined, });
  const [createItemPopup, setCreateItemPopup] = useState<CreateItemState>({ isOpen: false, defaultValue: '', isEditMode: false, itemId: undefined});
  const [createListPopup, setCreateListPopup] = useState<CreateListPopupState>({ isOpen: false, id: null, defaultValue: '', defaultX: 0, defaultY: 0, defaultWidth: 300, defaultHeight: 200});
  const [componentType, setComponentType] = useState<number>(0);
  const [listsData, setListsData] = useState<ListData[]>([]);
  const [barsData, setBarsData] = useState<BarData[]>([]);
  const [shopsData, setShopsData] = useState<ShopData[]>([]);
  const [tasks, setTasks] = useState<Duty[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isTaskPopupOpen, setIsTaskPopupOpen] = useState(false);
  const [isPricePopupOpen, setIsPricePopupOpen] = useState(false);
  const [currentListId, setCurrentListId] = useState<number | null>(null);
  const [currentShopId, setCurrentShopId] = useState<number>(0);
  const [maxQuantity, setMaxQuantity] = useState(0);
  const [nest, setNest] = useState<number | null>(null);
  const [checkedTasks, setCheckedTasks] = useState<number[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [prices, setPrices] = useState<Price[]>([])
  const [isEditMode, setIsEditMode] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | undefined>(undefined);
  const [priceToEdit, setPriceToEdit] = useState<Price | undefined>(undefined);
  const [isCreateBarPopupOpen, setIsCreateBarPopupOpen] = useState(false);
  const [showItemUse, setShowItemUse] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [barToEdit, setBarToEdit] = useState<Bar | null>(null);
  const [fromCurrency, setFromCurrency] = useState<number>(0)
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

  const handleDeleteTasks = async () => {
    const confirmed = await requestConfirmation(`${t.areYouSureTask}`);
    if (confirmed) {
      try {
        await Promise.all(
          checkedTasks.map((taskId) =>
            axios.delete(`http://localhost:8000/api/tasks/${taskId}/`)
          )
        );
        setCheckedTasks([]);
        fetchBars();
        fetchCurrencies();
        fetchItems();
        fetchTasks();
      } catch (error) {
        console.error('Error deleting tasks:', error);
      }
    } else {
      console.log('Delete cancelled');
    }
  };

  const handleCompleteTasks = async () => {
    const confirmed = await requestConfirmation(`${t.completeTasks}?`);
    if (confirmed) {
      try {
        await Promise.all(
          checkedTasks.map((taskId) =>
            axios.post(`http://localhost:8000/api/tasks/${taskId}/complete_task/`)
          )
        );
        setCheckedTasks([]);
        fetchBars();
        fetchCurrencies();
        fetchItems();
        fetchTasks();
      } catch (error) {
        console.error('Error deleting tasks:', error);
      }
    } else {
      console.log('Complete cancelled');
    }
  };

  const handleCompleteDuty = async (taskId: number) => {
    const confirmed = await requestConfirmation(`${t.completeDuties}`);
    if (confirmed) {
      try {
        await axios.post(`http://localhost:8000/api/tasks/${taskId}/complete_task/`);
        fetchBars();
        fetchCurrencies();
        fetchItems();
      } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                console.error('Error response headers:', error.response.headers);
            } else if (error.request) {
                console.error('Error request:', error.request);
            } else {
                console.error('Error message:', error.message);
            }
        } else {
            console.error('Unknown error:', error);
        }
      }
    } else {
      console.log('Complete cancelled');
    }
  };

  const handleDeleteDuty = async (taskId: number) => {
    const confirmed = await requestConfirmation(`${t.areYouSureDuty}`);
    if (confirmed) {
      try {
        await axios.delete(`http://localhost:8000/api/tasks/${taskId}/`)
        fetchBars();
        fetchCurrencies();
        fetchItems();
        fetchTasks();
      } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                console.error('Error response headers:', error.response.headers);
            } else if (error.request) {
                console.error('Error request:', error.request);
            } else {
                console.error('Error message:', error.message);
            }
        } else {
            console.error('Unknown error:', error);
        }
      }
    } else {
      console.log('Delete cancelled');
    }
  };

  const handleTaskCreate = (listId: number | null, nest_id: number | null, editMode = false, task = null) => {
    setCurrentListId(listId);
    setNest(nest_id);
    setIsEditMode(editMode);
    setTaskToEdit(task || undefined);
    setIsTaskPopupOpen(true);
  };

  const closePopup = () => {
    setIsTaskPopupOpen(false);
  };

  const handlePricePopup = (shopId: number, editMode = false, price = null) => {
    setCurrentShopId(shopId);
    setIsEditMode(editMode);
    setPriceToEdit(price || undefined);
    setIsPricePopupOpen(true);
  };

  const closePricePopup = () => {
    setIsPricePopupOpen(false);
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
  
    const minScale = 0.33;
    const maxScale = 3;
    const newScale = Math.min(maxScale, Math.max(minScale, scale + delta));
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

  const handleCloseList = async (id: number) => {
    const confirmed = await requestConfirmation(`${t.areYouSureList}`);
    if (confirmed) {
      try {
        await handleListDeletion(id);
        await fetchLists();
      } catch (error) {
        console.error('Error deleting list:', error);
      }
    } else {
      console.log('Delete cancelled');
    }
  };

  const handleCloseBar = async (id: number) => {
    const confirmed = await requestConfirmation(`${t.areYouSureBar}`);
    if (confirmed) {
      try {
        await handleBarDeletion(id);
        await fetchBars();
      } catch (error) {
        console.error('Error deleting bar:', error);
      }
    } else {
      console.log('Delete cancelled');
    }
  };

  const handleCloseShop = async (id: number) => {
    const confirmed = await requestConfirmation(`${t.areYouSureShop}`);
    if (confirmed) {
      try {
        await handleShopDeletion(id);
        await fetchShops();
      } catch (error) {
        console.error('Error deleting shop:', error);
      }
    } else {
      console.log('Delete cancelled');
    }
  };

  const handleDeletePrice = async (PriceId: number) => {
    const confirmed = await requestConfirmation(`${t.areYouSurePrice}`);
    if (confirmed) {
      try {
        await handlePriceDeletion(PriceId);
        await fetchPrices();
      } catch (error) {
        console.error('Error deleting shop:', error);
      }
    } else {
      console.log('Delete cancelled');
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/tasks/`);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
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
    fetchTasks()
    fetchPrices();
    fetchItems();
    fetchCurrencies();
    fetchTransactions();
    fetchRewards();
    fetchVouchers();
    fetchLists();
    fetchBars();
    fetchShops();
  }, []);

  const handlePriceConfirm = async (
    priceId: number,
    newCost: number,
    shopId: number,
    itemId: number,
    currencyId: number,
  ) => {
    if (isEditMode && priceToEdit) {
      await handlePriceUpdate(priceId, newCost, shopId, itemId, currencyId);
    } else {
      await handlePriceCreate(newCost, shopId, itemId, currencyId);
    }
    closePricePopup();
    fetchPrices();
  }

  const handlePriceUpdate = async (
    priceId: number,
    newCost: number,
    shopId: number,
    itemId: number,
    currencyId: number,
  ) => {
    try {
      const pricePayload = {
        cost: newCost,
        shop_id: shopId,
        item_id: itemId,
        currency_id: currencyId,
      };

      console.log('Update Price Payload:', pricePayload);
    
      await axios.patch(`http://localhost:8000/api/prices/${priceId}/update_price/`, pricePayload);
      console.log('Price updating successfully');
    } catch (error) {
      console.error('Error updating price:', error);
    }
  }

  const handlePriceCreate = async (
    newCost: number,
    shopId: number,
    itemId: number,
    currencyId: number,
  ) => {
    try {
      const pricePayload = {
        cost: newCost,
        shop_id: shopId,
        item_id: itemId,
        currency_id: currencyId,
      };

      console.log('Price Payload:', pricePayload);
    
      const response = await axios.post('http://localhost:8000/api/prices/create_price/', pricePayload);
      console.log('Price created successfully:', response.data);
    } catch (error) {
      console.error('Error creating price:', error);
    }
  }

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
    if (currentListId !== null && currentListId in taskUpdateCallbacks.current) {
      taskUpdateCallbacks.current[currentListId]();
    }
    fetchRewards();
    fetchTransactions();
    fetchVouchers();
    fetchTasks();
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
  
      // Step 1: Create the task
      const taskPayload = {
        list_id: currentListId,
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

  const fetchLists = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/lists/');
      const fetchedLists: ListData[] = response.data;
      const sortedLists = fetchedLists.sort((a, b) => a.layer.layer - b.layer.layer);
      setListsData(sortedLists);
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
        setListsData(prevLists => 
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
        previousLayer = listsData.find(list => list.list_id === foreignId)?.layer.layer || 0;
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
      fetchLists();
      fetchShops();
    } catch (error) {
      console.error('Error during optimistic update:', error);
    }
  };
  
  const handleListDeletion = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/lists/${id}/`);
      setListsData((prevListsData) => prevListsData.filter((list) => list.list_id !== id));
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

  const handleShopDeletion = async (id: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/shops/${id}/`);
      setShopsData((prevShops) => prevShops.filter((shop) => shop.shop_id !== id));
    } catch (error) {
      console.error('Error deleting shop:', error);
    }
  };

  const handlePriceDeletion = async (priceId: number) => {
    try {
      await axios.delete(`http://localhost:8000/api/prices/${priceId}/`);
      setPrices((prevPrices) => prevPrices.filter((price) => price.price_id !== priceId));
    } catch (error) {
      console.error('Error deleting shop:', error);
    }
  };

  const handleItemDeletion = async (id: number) => {
    const confirmed = await requestConfirmation(`${t.areYouSureItem}`);
    if (confirmed) {
      try {
        await axios.delete(`http://localhost:8000/api/items/${id}/`);
        setItems((prevItems) => prevItems.filter((item) => item.item_id !== id));
      } catch (error) {
        console.error('Error deleting task list:', error);
      }
      fetchItems();
      fetchVouchers();
    } else {
      console.log('Delete cancelled');
    }
  };

  const handleCurrencyDeletion = async (id: number) => {
    const confirmed = await requestConfirmation(`${t.areYouSureCurrency}`);
    if (confirmed) {
      try {
        await axios.delete(`http://localhost:8000/api/currencies/${id}/`);
        setCurrencies((prevCurrencies) => prevCurrencies.filter((currency) => currency.currency_id !== id));
      } catch (error) {
        console.error('Error deleting task list:', error);
      }
      fetchCurrencies();
      fetchTransactions();
    } else {
      console.log('Delete cancelled');
    }
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

  const handleExchangeCurrency = (fromCurrencyId: number) => {
    setShowExchange(true);
    setFromCurrency(fromCurrencyId)
  }

  const handleCancelExchange = () => {
    setShowExchange(false);
  }

  const handleConfirmExchange = async (fromCurrencyId: number, toCurrencyId: number, fromAmount: number) => {
    try {
        const response = await axios.post(
            'http://localhost:8000/api/currencies/exchange_currency/', 
            {
                from_currency_id: fromCurrencyId,
                to_currency_id: toCurrencyId,
                amount: fromAmount,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );
        console.log('Exchange successful:', response.data);
    } catch (error: any) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Error response:', error.response.data);
            console.error('Error status:', error.response.status);
            console.error('Error headers:', error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Error request:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }
        console.error('Error config:', error.config);
    }

    fetchCurrencies();
    setShowExchange(false);
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

  const handleUseItem = (itemId: number, itemStorage: number) => {
    setSelectedItemId(itemId);
    setShowItemUse(true);
    setMaxQuantity(itemStorage);
  }

  const handleConfirmUse = async (useNote: string, useQuantity: number) => {
    if (selectedItemId !== null) {
      try {
        await axios.post(`http://localhost:8000/api/items/${selectedItemId}/use_item/`, {
          use_note: useNote,
          use_quantity: useQuantity,
        });
        // Refresh data or perform necessary updates
      } catch (error) {
        console.error('Error using item:', error);
      }
    }
    setShowItemUse(false);
    fetchItems();
  };

  const handleCancelUse = () => {
    setShowItemUse(false);
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
    if (type === 'list') {
      setListsData((prevListsData) =>
        prevListsData.map((listData) =>
          listData.list_id === id ? { ...listData, x_axis: x, y_axis: y } : listData
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
    if (type === 'list') {
      setListsData((prevListsData) =>
        prevListsData.map((listData) =>
          listData.list_id === id
            ? { ...listData, size_horizontal: width, size_vertical: height }
            : listData
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

  const handleEditShop = (id: number, defaultValue: string, x: number, y: number, width: number, height: number) => {
    setCreateListPopup({
      isOpen: true,
      id,
      defaultValue,
      defaultX: x,
      defaultY: y,
      defaultWidth: width,
      defaultHeight: height,
    });
    setComponentType(3) //shop
  };

  const handleCreateNewShop = async () => {
    setCreateListPopup({
      isOpen: true,
      id: null,
      defaultValue: '',
      defaultX: 0,
      defaultY: 0,
      defaultWidth: 300,
      defaultHeight: 300,
    });
    setComponentType(3) //shop
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
    setComponentType(1) //list
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
    setComponentType(1) //list
  };

  const handleSaveList = async (id: number | null, newName: string, x: number, y: number, width: number, height: number) => {
    try {
      if (id === null) {
        // Create new list
        const response = await axios.post('http://localhost:8000/api/lists/', {
          list_name: newName,
          x_axis: x,
          y_axis: y,
          size_horizontal: width,
          size_vertical: height,
        });
        const newList: ListData = response.data;
        setListsData((prevListsData) => [...prevListsData, newList]);
      } else {
        // Update existing list
        await axios.patch(`http://localhost:8000/api/lists/${id}/`, {
          list_name: newName,
          x_axis: x,
          y_axis: y,
          size_horizontal: width,
          size_vertical: height,
        });
        setListsData((prevListsData) =>
          prevListsData.map((list) =>
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

  const handleSaveShop = async (id: number | null, newName: string, x: number, y: number, width: number, height: number) => {
    try {
      if (id === null) {
        // Create new shop
        const response = await axios.post('http://localhost:8000/api/shops/', {
          shop_name: newName,
          x_axis: x,
          y_axis: y,
          size_horizontal: width,
          size_vertical: height,
        });
        const newShop: ShopData = response.data;
        setShopsData((prevShopsData) => [...prevShopsData, newShop]);
      } else {
        // Update existing shop
        await axios.patch(`http://localhost:8000/api/shops/${id}/`, {
          shop_name: newName,
          x_axis: x,
          y_axis: y,
          size_horizontal: width,
          size_vertical: height,
        });
        setShopsData((prevShopsData) =>
          prevShopsData.map((shop) =>
            shop.shop_id === id
              ? { ...shop, shop_name: newName, x_axis: x, y_axis: y, size_horizontal: width, size_vertical: height }
              : shop
          )
        );
      }
      setCreateListPopup({ isOpen: false, id: null, defaultValue: '', defaultX: 0, defaultY: 0, defaultWidth: 100, defaultHeight: 100 });
    } catch (error) {
      console.error('Error saving list:', error);
    }
  };

  const handleBuyClick = async (newBalances: { [currencyId: number]: number }, inputValues: { [key: number]: number }) => {
    try {
        // Filter out balances that have not changed
        const updatedBalances = Object.keys(newBalances).reduce((acc, currencyId) => {
            const currency = currencies.find(c => c.currency_id === parseInt(currencyId));
            if (currency && currency.owned !== newBalances[parseInt(currencyId)]) {
                acc[parseInt(currencyId)] = newBalances[parseInt(currencyId)];
            }
            return acc;
        }, {} as { [currencyId: number]: number });

        // Send the update request to the server for currencies
        const currencyResponse = await axios.post('http://localhost:8000/api/currencies/update_balances/', updatedBalances, {
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (currencyResponse.status === 200) {
            // If currencies updated successfully, update the items
            const itemUpdates: { [itemId: number]: number } = {};
            prices.forEach(price => {
                const inputValue = inputValues[price.price_id] || 0;
                if (inputValue > 0) {
                    if (itemUpdates[price.item]) {
                        itemUpdates[price.item] += inputValue;
                    } else {
                        itemUpdates[price.item] = inputValue;
                    }
                }
            });

            const itemResponse = await axios.post('http://localhost:8000/api/items/update_storage/', itemUpdates, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (itemResponse.status === 200) {
                console.log('Items updated successfully');
            } else {
                console.error('Failed to update items', itemResponse);
            }
        } else {
            console.error('Failed to update balances', currencyResponse);
        }
    } catch (error) {
        console.error('Error updating balances and items', error);
    }
    fetchCurrencies();
    fetchItems();
  };

  const getFilteredTasks = (listId: number | null) => {
    if (listId === null) {
        return tasks.filter(task => task.list_task === null);
    }
    return tasks.filter(task => task.list_task === listId);
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
          onCreateNewShop={handleCreateNewShop}
          onReturnHome={onReturnHome} 
          onCreateNewList={handleCreateNewList} 
          onCompleteTasks={handleCompleteTasks}
          onCreateNewBar={handleCreateNewBar}
          onDeleteTasks={handleDeleteTasks}
        />}
        <ResetButton onClick={handleReset} />
        <div className={styles.currencies}>
          <Currencies 
            currencies={currencies}
            onExchangeCurrency={handleExchangeCurrency}
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
            onUseItem={handleUseItem}
          /> 
        </div>
        <div className={styles.duties}>
          <Duties 
            duties={getFilteredTasks(null)}
            rewards={rewards}
            transactions={transactions}
            vouchers={vouchers}
            barsData={barsData}
            currencies={currencies}
            items={items}
            onEdit={handleTaskCreate}
            onComplete={handleCompleteDuty}
            onDelete={handleDeleteDuty}
          /> 
        </div>
        {listsData.map((list) => (
          <div key={list.list_id} className={`${styles.list} list`}>
          <List 
            tasks={getFilteredTasks(list.list_id)}
            id={list.list_id} 
            title={list.list_name}
            initialX={list.x_axis}
            initialY={list.y_axis}
            initialWidth={list.size_horizontal}
            initialHeight={list.size_vertical}
            translate={translate} 
            scale={scale} 
            zIndex={list.layer.layer}
            rewards={rewards}
            transactions={transactions}
            barsData={barsData}
            currencies={currencies}
            items={items}
            vouchers={vouchers}
            detailView={list.detail_view}
            onExpand={toggleExpand}
            onClose={handleCloseList} 
            onRename={(id) => handleEditList(id, list.list_name, list.x_axis, list.y_axis, list.size_horizontal, list.size_vertical)}
            onClick={() => moveItemToHighestLayer(list.list_id, list.layer.foreign_table)}
            onDrag={handleDragWindow}
            onResize={handleResizeWindow}
            onPositionUpdate={(id, x, y) => handleDragWindow(id, x, y, 'list')}
            onSizeUpdate={(id, width, height) => handleResizeWindow(id, width, height, 'list')}
            
            checkedTasks={checkedTasks}
            toggleTaskChecked={toggleTaskChecked}
            openPopup={handleTaskCreate}
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
              onDelete={handleDeletePrice}
              onBuy={handleBuyClick}
              onClose={handleCloseShop}
              onEdit={(id) => handleEditShop(id, shop.shop_name, shop.x_axis, shop.y_axis, shop.size_horizontal, shop.size_vertical)}
              onCreate={handlePricePopup}
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
            componentType={componentType}
            onSaveList={handleSaveList}
            onSaveShop={handleSaveShop}
            onClose={() => setCreateListPopup({ isOpen: false, id: null, defaultValue: '', defaultX: 0, defaultY: 0, defaultWidth: 100, defaultHeight: 100 })}
          />
        )}
        {isTaskPopupOpen && (
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
        {isPricePopupOpen && (
          <CreatePricePopup
            onClose={closePricePopup}
            onConfirm={handlePriceConfirm}
            currencies={currencies}
            items={items}
            isEditMode={isEditMode}
            priceToEdit={priceToEdit}
            shopId={currentShopId}
            shopsData={shopsData}
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
        <UseItemPopup
          show={showItemUse}
          onConfirm={handleConfirmUse}
          onCancel={handleCancelUse}
          maxQuantity={maxQuantity}
        />
        <ExchangePopup
          show={showExchange}
          fromCurrencyId={fromCurrency}
          currencies={currencies}
          onClose={handleCancelExchange}
          onConfirm={handleConfirmExchange}
        />
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
