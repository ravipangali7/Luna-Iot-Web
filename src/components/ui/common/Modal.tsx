import React, { useEffect } from 'react';
import type { BaseProps } from '../../types';
import './Common.css';

interface ModalProps extends BaseProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({
  children,
  isOpen,
  onClose,
  title,
  size = 'md',
  className = '',
  ...props
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const baseClasses = 'modal';
  const sizeClasses = `modal--${size}`;
  
  const combinedClasses = [
    baseClasses,
    sizeClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={combinedClasses} onClick={(e) => e.stopPropagation()} {...props}>
        {title && (
          <div className="modal__header">
            <h3 className="modal__title">{title}</h3>
            <button className="modal__close" onClick={onClose}>
              ×
            </button>
          </div>
        )}
        <div className="modal__body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;