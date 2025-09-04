import React from 'react';
import type { BaseProps } from '../../types';
import './Layout.css';

interface GridProps extends BaseProps {
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
}

const Grid: React.FC<GridProps> = ({ children, cols = 1, gap = 'md', className = '', ...props }) => {
  const baseClasses = 'grid';
  const colsClasses = `grid--cols-${cols}`;
  const gapClasses = `grid--gap-${gap}`;
  
  const combinedClasses = [
    baseClasses,
    colsClasses,
    gapClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={combinedClasses} {...props}>
      {children}
    </div>
  );
};

export default Grid;