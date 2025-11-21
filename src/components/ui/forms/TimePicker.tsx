import React, { forwardRef } from 'react';
import type { InputProps } from '../../types';
import './Input.css';

const TimePicker = forwardRef<HTMLInputElement, InputProps>(({
  value,
  defaultValue,
  size = 'md',
  disabled = false,
  required = false,
  error,
  onChange,
  onBlur,
  onFocus,
  className = '',
  ...props
}, ref) => {
  const baseClasses = 'input timepicker';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="input-wrapper">
      <input
        ref={ref}
        type="time"
        className={combinedClasses}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...props}
      />
      {error && <span className="input__error">{error}</span>}
    </div>
  );
});

TimePicker.displayName = 'TimePicker';

export default TimePicker;

