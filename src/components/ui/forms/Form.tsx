import React from 'react';
import type { BaseProps } from '../../types';
import './Form.css';

const Form: React.FC<BaseProps> = ({ children, className = '', ...props }) => {
  const combinedClasses = ['form', className].filter(Boolean).join(' ');

  return (
    <form className={combinedClasses} {...props}>
      {children}
    </form>
  );
};

export default Form;