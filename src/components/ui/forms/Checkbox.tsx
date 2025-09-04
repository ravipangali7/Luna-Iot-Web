import React, { forwardRef } from 'react';
import type { BaseProps } from '../../types';
import './Input.css';

interface CheckboxProps extends BaseProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (checked: boolean) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  checked,
  defaultChecked,
  disabled = false,
  required = false,
  error,
  onChange,
  onBlur,
  onFocus,
  className = '',
  children,
  ...props
}, ref) => {
  const baseClasses = 'checkbox';
  const stateClasses = error ? 'checkbox--error' : '';
  const disabledClasses = disabled ? 'checkbox--disabled' : '';
  
  const combinedClasses = [
    baseClasses,
    stateClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  return (
    <div className="checkbox-wrapper">
      <label className={combinedClasses}>
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          required={required}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          {...props}
        />
        <span className="checkbox__checkmark"></span>
        {children}
      </label>
      {error && <span className="checkbox__error">{error}</span>}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;