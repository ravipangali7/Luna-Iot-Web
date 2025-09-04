import React from 'react';
import type { BaseProps } from '../../types';
import './Layout.css';

interface ColProps extends BaseProps {
  size?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
}

const Col: React.FC<ColProps> = ({ children, size, className = '', ...props }) => {
  const baseClasses = 'col';
  const sizeClasses = size ? `col--${size}` : '';
  
  const combinedClasses = [
    baseClasses,
    sizeClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
};

export default Col;