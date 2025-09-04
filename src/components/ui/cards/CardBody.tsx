import React from 'react';
import type { BaseProps } from '../../types';
import './Card.css';

const CardBody: React.FC<BaseProps> = ({ children, className = '', ...props }) => {
  const combinedClasses = ['card__body', className].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
};

export default CardBody;