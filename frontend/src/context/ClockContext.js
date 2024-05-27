import React, { createContext, useState, useEffect } from 'react';

export const ClockContext = createContext();

export const ClockProvider = ({ children }) => {
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-GB'); // DD/MM/YYYY format
      const formattedTime = currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); // 24-hour format
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setCurrentDateTime(`${formattedDate}, ${formattedTime} (${timeZone})`);
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <ClockContext.Provider value={currentDateTime}>
      {children}
    </ClockContext.Provider>
  );
};
