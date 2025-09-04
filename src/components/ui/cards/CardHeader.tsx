import React from 'react';
import type { BaseProps } from '../../types';
import './Card.css';

const CardHeader: React.FC<BaseProps> = ({ children, className = '', ...props }) => {
  const combinedClasses = ['card__header', className].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
};

export default CardHeader;