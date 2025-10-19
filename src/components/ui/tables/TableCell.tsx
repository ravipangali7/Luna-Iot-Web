import React from 'react';
import type { BaseProps } from '../../types';
import './Table.css';

const TableCell: React.FC<BaseProps> = ({ children, className = '', colSpan, title, ...props }) => {
  const combinedClasses = ['table__cell', className].filter(Boolean).join(' ');

  return (
    <td className={combinedClasses} colSpan={colSpan} title={title} {...props}>
      {children}
    </td>
  );
};

export default TableCell;