import React from 'react';
import type { BaseProps } from '../../types';
import './Button.css';

const ButtonGroup: React.FC<BaseProps> = ({ children, className = '', ...props }) => {
  const combinedClasses = ['btn-group', className].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
};

export default ButtonGroup;