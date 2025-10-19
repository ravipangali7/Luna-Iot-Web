import React from 'react';
import type { BaseProps } from '../../types';
import './Table.css';

const TableCell: React.FC<BaseProps> = ({ children, className = '', title, colSpan, ...props }) => {
  const combinedClasses = ['table__cell', className].filter(Boolean).join(' ');

  return (
    <td className={combinedClasses} title={title} colSpan={colSpan} {...props}>
      {children}
    </td>
  );
};

export default TableCell;