// Card Component - Brutalist Design
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const cardVariants = {
  default: 'border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  thick: 'border-3 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]',
  accent: 'border-2 border-black bg-[#F5E600] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
  dark: 'border-2 border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
};

const cardSizes = {
  default: 'p-6',
  sm: 'p-4',
  lg: 'p-8',
};

export interface CardProps {
  className?: string;
  variant?: keyof typeof cardVariants;
  size?: keyof typeof cardSizes;
  children: React.ReactNode;
}

const Card = ({ className, variant = 'default', size = 'default', children }: CardProps) => {
  return (
    <div className={cn(cardVariants[variant], cardSizes[size], className)}>
      {children}
    </div>
  );
};
Card.displayName = 'Card';

export { Card, cardVariants, cardSizes };
