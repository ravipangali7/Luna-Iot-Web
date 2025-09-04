import React from 'react';
import type { TableProps } from '../../types';
import './Table.css';

const Table: React.FC<TableProps> = ({
  children,
  variant = 'default',
  striped = false,
  bordered = false,
  hover = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'table';
  const variantClasses = `table--${variant}`;
  const stripedClasses = striped ? 'table--striped' : '';
  const borderedClasses = bordered ? 'table--bordered' : '';
  const hoverClasses = hover ? 'table--hover' : '';
  
  const combinedClasses = [
    baseClasses,
    variantClasses,
    stripedClasses,
    borderedClasses,
    hoverClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="table-container">
      <table className={combinedClasses} {...props}>
        {children}
      </table>
    </div>
  );
};

export default Table;