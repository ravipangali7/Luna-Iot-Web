import React, { forwardRef } from 'react';
import type { InputProps } from '../../types';
import './Input.css';

const Input = forwardRef<HTMLInputElement, InputProps>(({
    type = 'text',
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
    icon,
    ...props
}, ref) => {
    const baseClasses = 'input';
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
        if (type === 'file') {
            // For file inputs, pass the files directly
            onChange?.(e.target.files ? 'file selected' : '');
        } else {
            onChange?.(e.target.value);
        }
    };

    return (
        <div className="input-wrapper">
            {icon && (
                <div className="input-icon">
                    {icon}
                </div>
            )}
            <input
                ref={ref}
                type={type}
                className={combinedClasses}
                placeholder={placeholder}
                value={type === 'file' ? undefined : value}
                defaultValue={type === 'file' ? undefined : defaultValue}
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

Input.displayName = 'Input';

export default Input;