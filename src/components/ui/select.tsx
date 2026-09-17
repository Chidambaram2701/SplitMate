// Select Component - Brutalist Design
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: { value: string; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options = [], children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-12 w-full appearance-none bg-white text-black transition-all duration-200 focus:outline-none focus:ring-0 focus:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50',
          'border-2 border-black px-4 py-3 text-sm font-mono',
          className
        )}
        ref={ref}
        {...props}
      >
        {children ||
          options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Select };
