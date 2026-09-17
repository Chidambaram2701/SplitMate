// MoneyDisplay Component - Brutalist Financial Terminal Style
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MoneyDisplayProps {
  amount: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'positive' | 'negative' | 'neutral';
  className?: string;
}

const MoneyDisplay = ({
  amount,
  label,
  size = 'md',
  variant = 'default',
  className,
}: MoneyDisplayProps) => {
  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  };

  const variantClasses = {
    default: 'text-black',
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-black',
  };

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <span className="font-bold uppercase tracking-widest text-xs border-b-2 border-black pb-1">
          {label}
        </span>
      )}
      <span
        className={cn(
          'font-mono font-bold',
          sizeClasses[size],
          variantClasses[variant]
        )}
      >
        {formatAmount(amount)}
      </span>
    </div>
  );
};
MoneyDisplay.displayName = 'MoneyDisplay';

export { MoneyDisplay };
