import React, { useState, useRef, useEffect } from 'react';
import type { BaseProps } from '../../types';
import './Common.css';

interface TooltipProps extends BaseProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 200,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showTooltip = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({ x: rect.left, y: rect.top });
    }
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const baseClasses = 'tooltip';
  const positionClasses = `tooltip--${position}`;
  
  const combinedClasses = [
    baseClasses,
    positionClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={triggerRef}
      className={combinedClasses}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      {...props}
    >
      {children}
      {isVisible && (
        <div
          className="tooltip__content"
          style={{
            left: coords.x,
            top: coords.y
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;