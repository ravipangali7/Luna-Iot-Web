import React, { forwardRef } from 'react';
import type { BaseProps } from '../../types';
import './Input.css';

interface RadioProps extends BaseProps {
  name: string;
  value: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(({
  name,
  value,
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
  const baseClasses = 'radio';
  const stateClasses = error ? 'radio--error' : '';
  const disabledClasses = disabled ? 'radio--disabled' : '';
  
  const combinedClasses = [
    baseClasses,
    stateClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="radio-wrapper">
      <label className={combinedClasses}>
        <input
          ref={ref}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          required={required}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          {...props}
        />
        <span className="radio__checkmark"></span>
        {children}
      </label>
      {error && <span className="radio__error">{error}</span>}
    </div>
  );
});

Radio.displayName = 'Radio';

export default Radio;