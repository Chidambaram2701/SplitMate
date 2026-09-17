// Label Component - Brutalist Design
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'flex items-center gap-2 text-xs font-bold uppercase tracking-wider border-b-2 border-black pb-1',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-red-600">*</span>}
      </label>
    );
  }
);
Label.displayName = 'Label';

export { Label };
