import React from 'react';
import type { BaseProps } from '../../types';
import './Button.css';

interface ActionButtonProps extends BaseProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'compact';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  tooltip?: string;
  title?: string;
  compact?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  variant = 'outline',
  size = 'sm',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  icon,
  tooltip,
  title,
  compact = false,
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn--${variant}`;
  const sizeClasses = compact ? 'btn--compact' : `btn--${size}`;
  const stateClasses = disabled ? 'btn--disabled' : '';
  const loadingClasses = loading ? 'btn--loading' : '';
  const iconClasses = icon && !children ? 'btn--icon' : '';
  
  const combinedClasses = [
    baseClasses,
    variantClasses,
    sizeClasses,
    stateClasses,
    loadingClasses,
    iconClasses,
    className
  ].filter(Boolean).join(' ');

  const buttonElement = (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || loading}
      onClick={onClick}
      title={title || tooltip}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      {icon && <span className="btn__icon">{icon}</span>}
      {children}
    </button>
  );

  if (tooltip) {
    return (
      <div className="relative group">
        {buttonElement}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {tooltip}
        </div>
      </div>
    );
  }

  return buttonElement;
};

export default ActionButton;
