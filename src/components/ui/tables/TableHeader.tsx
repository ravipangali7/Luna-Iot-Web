import React from 'react';
import type { BaseProps } from '../../types';
import './Table.css';

const TableHeader: React.FC<BaseProps> = ({ children, className = '', ...props }) => {
  const combinedClasses = ['table__header', className].filter(Boolean).join(' ');

  return (
    <th className={combinedClasses} {...props}>
      {children}
    </th>
  );
};

export default TableHeader;