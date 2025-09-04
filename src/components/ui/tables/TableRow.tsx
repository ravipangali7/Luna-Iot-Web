import React from 'react';
import type { BaseProps } from '../../types';
import './Table.css';

const TableRow: React.FC<BaseProps> = ({ children, className = '', ...props }) => {
  const combinedClasses = ['table__row', className].filter(Boolean).join(' ');

  return (
    <tr className={combinedClasses} {...props}>
      {children}
    </tr>
  );
};

export default TableRow;