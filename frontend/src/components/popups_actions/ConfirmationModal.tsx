import React from 'react';
import { useTranslation } from '../../contexts/TranslationContext';
import styles from './confirmationModal.module.css'; // Add your styles here

interface ConfirmationModalProps {
    show: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}
  
  const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ show, message, onConfirm, onCancel }) => {
    const { t } = useTranslation();

    if (!show) {
        return null;
    }
  
    return (
        <div className={styles.modal_backdrop}>
            <div className={styles.modal}>
                <h2>{message}</h2>
                <div className={styles.modal_actions}>
                    <button onClick={onCancel}>{t.cancel}</button>
                    <button onClick={onConfirm}>{t.confirm}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;