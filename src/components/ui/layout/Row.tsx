import React from 'react';
import type { BaseProps } from '../../types';
import './Layout.css';

const Row: React.FC<BaseProps> = ({ children, className = '', ...props }) => {
  const combinedClasses = ['row', className].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
};

export default Row;