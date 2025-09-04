import React from 'react';
import type { BaseProps } from '../../types';
import './Common.css';

interface SpinnerProps extends BaseProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  ...props
}) => {
  const baseClasses = 'spinner';
  const sizeClasses = `spinner--${size}`;
  const colorClasses = `spinner--${color}`;
  
  const combinedClasses = [
    baseClasses,
    sizeClasses,
    colorClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses} {...props}>
      <div className="spinner__circle"></div>
    </div>
  );
};

export default Spinner;