// StatusBadge Component - Brutalist Design
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type StatusType = 'paid' | 'pending' | 'due-soon' | 'due-today' | 'overdue' | 'partial' | 'active' | 'inactive' | 'cancelled';

const statusStyles = {
  paid: 'bg-green-500 text-white border-black',
  pending: 'bg-white text-black border-black',
  'due-soon': 'bg-[#F5E600] text-black border-black',
  'due-today': 'bg-[#F5E600] text-black border-black',
  overdue: 'bg-[#FF5A1F] text-white border-black',
  partial: 'bg-[#F5E600] text-black border-black',
  active: 'bg-green-500 text-white border-black',
  inactive: 'bg-gray-300 text-black border-black',
  cancelled: 'bg-red-600 text-white border-black',
};

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const StatusBadge = ({ status, label, className }: StatusBadgeProps) => {
  const statusLabels: Record<StatusType, string> = {
    paid: 'PAID',
    pending: 'PENDING',
    'due-soon': 'DUE SOON',
    'due-today': 'DUE TODAY',
    overdue: 'OVERDUE',
    partial: 'PARTIAL',
    active: 'ACTIVE',
    inactive: 'INACTIVE',
    cancelled: 'CANCELLED',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border',
        statusStyles[status],
        className
      )}
    >
      {label || statusLabels[status]}
    </span>
  );
};
StatusBadge.displayName = 'StatusBadge';

export { StatusBadge, type StatusType };
