import React, { forwardRef } from 'react';
import type { BaseProps } from '../../types';
import './Input.css';

interface SelectProps extends BaseProps {
  options: Array<{ value: string; label: string }>;
  value?: string;
  defaultValue?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  id?: string;
  name?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  options,
  value,
  defaultValue,
  size = 'md',
  disabled = false,
  required = false,
  error,
  onChange,
  onBlur,
  onFocus,
  id,
  name,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'input select';
  const sizeClasses = `input--${size}`;
  const stateClasses = error ? 'input--error' : '';
  const disabledClasses = disabled ? 'input--disabled' : '';
  
  const combinedClasses = [
    baseClasses,
    sizeClasses,
    stateClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="input-wrapper">
      <select
        ref={ref}
        className={combinedClasses}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        id={id}
        name={name}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="input__error">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;