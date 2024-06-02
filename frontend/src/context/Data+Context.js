import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch data from the backend API when the provider mounts
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/tasklists/'); // Adjust the endpoint as per your Django URL configuration
        setData(response.data); // Update data state with fetched data
        console.log('Fetched data:', response.data); // Log fetched data in console
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData(); // Call the fetchData function
  }, []);

  const updateTaskLists = (newTaskLists) => {
    setData(newTaskLists);
  };

  return (
    <DataContext.Provider value={{ data, updateTaskLists }}>
      {children}
    </DataContext.Provider>
  );
};