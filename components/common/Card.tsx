
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', titleClassName = '' }) => {
  return (
    <div className={`bg-white dark:bg-secondary p-4 sm:p-6 rounded-lg shadow-xl ${className}`}>
      {title && (
        <h2 className={`text-xl sm:text-2xl font-semibold text-secondary dark:text-primary mb-4 pb-2 border-b border-slate-200 dark:border-primary/30 ${titleClassName}`}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
};