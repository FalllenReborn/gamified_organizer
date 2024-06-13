import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface ClockContextType {
  currentDateTime: string;
}

export const ClockContext = createContext<string>('');

interface ClockProviderProps {
  children: ReactNode;
}

export const ClockProvider: React.FC<ClockProviderProps> = ({ children }) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  useEffect(() => {
    const intervalId = setInterval(() => {
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-GB'); // DD/MM/YYYY format
      const formattedTime = currentDate.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }); // 24-hour format
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
