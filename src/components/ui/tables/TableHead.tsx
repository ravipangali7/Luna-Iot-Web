import React from 'react';
import type { BaseProps } from '../../types';
import './Table.css';

const TableHead: React.FC<BaseProps> = ({ children, className = '', ...props }) => {
  const combinedClasses = ['table__head', className].filter(Boolean).join(' ');

  return (
    <thead className={combinedClasses} {...props}>
      {children}
    </thead>
  );
};

export default TableHead;