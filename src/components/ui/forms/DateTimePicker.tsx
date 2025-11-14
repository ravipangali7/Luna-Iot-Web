import React, { forwardRef } from 'react';
import type { InputProps } from '../../types';
import './Input.css';

const DateTimePicker = forwardRef<HTMLInputElement, InputProps>(({
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
  const baseClasses = 'input datetimepicker';
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

  // Convert value to datetime-local format (YYYY-MM-DDTHH:mm)
  const formatValue = (val: string | undefined) => {
    if (!val) return '';
    // If it's already in datetime-local format, return as is
    if (val.includes('T')) {
      // Remove seconds and timezone if present
      return val.substring(0, 16);
    }
    // If it's just a date (YYYY-MM-DD), add default time
    if (val.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return `${val}T00:00`;
    }
    return val;
  };

  return (
    <div className="input-wrapper">
      <input
        ref={ref}
        type="datetime-local"
        className={combinedClasses}
        value={formatValue(value)}
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

DateTimePicker.displayName = 'DateTimePicker';

export default DateTimePicker;

