
import React, { useEffect } from 'react';

interface AlertPopupProps {
  message: string;
  onClose: () => void;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export const AlertPopup: React.FC<AlertPopupProps> = ({ message, onClose, type = 'info', duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  // Base classes with text color suitable for light backgrounds first
  const baseClasses = "fixed top-20 right-4 p-4 rounded-lg shadow-xl max-w-sm z-[100]";
  
  // Theme-specific text and background colors
  const typeClasses = {
    success: "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100",
    error: "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500 dark:text-yellow-900", // Darker text on yellow for both themes
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`}>
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button 
          onClick={onClose} 
          className="ml-4 font-bold text-lg opacity-70 hover:opacity-100" // Text color will be inherited
        >
            &times;
        </button>
      </div>
    </div>
  );
};