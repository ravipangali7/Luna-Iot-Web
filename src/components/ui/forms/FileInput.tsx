import React, { forwardRef } from 'react';
import type { BaseProps } from '../../types';
import './Input.css';

interface FileInputProps extends BaseProps {
  accept?: string;
  multiple?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  required?: boolean;
  error?: string;
  onChange?: (files: FileList | null) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

const FileInput = forwardRef<HTMLInputElement, FileInputProps>(({
  accept,
  multiple = false,
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
  const baseClasses = 'input file-input';
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
    onChange?.(e.target.files);
  };

  return (
    <div className="input-wrapper">
      <input
        ref={ref}
        type="file"
        className={combinedClasses}
        accept={accept}
        multiple={multiple}
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

FileInput.displayName = 'FileInput';

export default FileInput;