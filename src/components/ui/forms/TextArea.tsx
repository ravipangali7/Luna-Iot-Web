import React, { forwardRef } from 'react';
import type { InputProps } from '../../types';
import './Input.css';

const TextArea = forwardRef<HTMLTextAreaElement, InputProps>(({
  placeholder,
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
  const baseClasses = 'input textarea';
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

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="input-wrapper">
      <textarea
        ref={ref}
        className={combinedClasses}
        placeholder={placeholder}
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

TextArea.displayName = 'TextArea';

export default TextArea;