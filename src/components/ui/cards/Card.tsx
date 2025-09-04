import React from 'react';
import type { CardProps } from '../../types';
import './Card.css';

const Card: React.FC<CardProps> = ({
  children,
  shadow = 'md',
  bordered = true,
  className = '',
  style,
  ...props
}) => {
  const baseClasses = 'card';
  const shadowClasses = `card--shadow-${shadow}`;
  const borderedClasses = bordered ? 'card--bordered' : '';
  
  const combinedClasses = [
    baseClasses,
    shadowClasses,
    borderedClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses} style={style} {...props}>
      {children}
    </div>
  );
};

export default Card;