import React from 'react';
import type { AlertProps } from '../../types';
import './Alert.css';

const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'primary',
  dismissible = false,
  onDismiss,
  className = '',
  ...props
}) => {
  const baseClasses = 'alert';
  const variantClasses = `alert--${variant}`;
  const dismissibleClasses = dismissible ? 'alert--dismissible' : '';
  
  const combinedClasses = [
    baseClasses,
    variantClasses,
    dismissibleClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses} {...props}>
      <div className="alert__content">{children}</div>
      {dismissible && (
        <button
          className="alert__dismiss"
          onClick={onDismiss}
          aria-label="Close alert"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;