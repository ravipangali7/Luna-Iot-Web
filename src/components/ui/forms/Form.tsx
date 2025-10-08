import React from 'react';
import type { BaseProps } from '../../types';
import './Form.css';

interface FormProps extends BaseProps {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

const Form: React.FC<FormProps> = ({ children, className = '', ...props }) => {
  const combinedClasses = ['form', className].filter(Boolean).join(' ');

  return (
    <form className={combinedClasses} {...props}>
      {children}
    </form>
  );
};

export default Form;