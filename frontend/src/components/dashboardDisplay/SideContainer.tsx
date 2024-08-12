import React from 'react';
import styles from './sideContainer.module.css';

interface SideContainerProps {
    children: React.ReactNode;
}

const SideContainer: React.FC<SideContainerProps> = ({ children }) => {
    return (
        <div className={styles.container}>
            {React.Children.map(children, (child, index) => (
                <div 
                    key={index} 
                    className={styles.childWrapper} 
                    style={{ top: `${index}px` }}  // 200px component height + 20px gap
                >
                    {child}
                </div>
            ))}
        </div>
    );
};

export default SideContainer;
