import React, { createContext, useState, useContext, ReactNode } from 'react';
import ConfirmationModal from '../components/popups_actions/ConfirmationModal';

interface ConfirmationContextProps {
  requestConfirmation: (message: string) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextProps | undefined>(undefined);

export const useConfirmation = (): ConfirmationContextProps => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
};

interface ConfirmationProviderProps {
  children: ReactNode;
}

export const ConfirmationProvider: React.FC<ConfirmationProviderProps> = ({ children }) => {
  const [confirmationState, setConfirmationState] = useState({
    show: false,
    message: '',
    resolve: (value: boolean) => {},
  });

  const requestConfirmation = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmationState({
        show: true,
        message,
        resolve,
      });
    });
  };

  const handleConfirm = () => {
    setConfirmationState({ ...confirmationState, show: false });
    confirmationState.resolve(true);
  };

  const handleCancel = () => {
    setConfirmationState({ ...confirmationState, show: false });
    confirmationState.resolve(false);
  };

  return (
    <ConfirmationContext.Provider value={{ requestConfirmation }}>
      {children}
      <ConfirmationModal
        show={confirmationState.show}
        message={confirmationState.message}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmationContext.Provider>
  );
};