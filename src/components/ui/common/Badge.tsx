import React from 'react';
import type { BadgeProps } from '../../types';
import './Badge.css';

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'badge';
  const variantClasses = `badge--${variant}`;
  const sizeClasses = `badge--${size}`;
  
  const combinedClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={combinedClasses} {...props}>
      {children}
    </span>
  );
};

export default Badge;