import React from 'react';
import type { BaseProps } from '../../types';
import './Table.css';

const TableBody: React.FC<BaseProps> = ({ children, className = '', ...props }) => {
  const combinedClasses = ['table__body', className].filter(Boolean).join(' ');

  return (
    <tbody className={combinedClasses} {...props}>
      {children}
    </tbody>
  );
};

export default TableBody;