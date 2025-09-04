import React from 'react';
import type { BaseProps } from '../../types';
import './Layout.css';

const Container: React.FC<BaseProps> = ({ children, className = '', ...props }) => {
  const combinedClasses = ['container', className].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
};

export default Container;