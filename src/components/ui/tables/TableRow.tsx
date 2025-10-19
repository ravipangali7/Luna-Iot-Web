import React from 'react';
import type { BaseProps } from '../../types';
import './Table.css';

interface TableRowProps extends BaseProps {
  onClick?: () => void;
}

const TableRow: React.FC<TableRowProps> = ({ children, className = '', onClick, ...props }) => {
  const combinedClasses = ['table__row', className].filter(Boolean).join(' ');

  return (
    <tr className={combinedClasses} onClick={onClick} {...props}>
      {children}
    </tr>
  );
};

export default TableRow;