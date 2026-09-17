// Utility Functions
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function generateId(prefix: string = ''): string {
  return `${prefix}${Math.random().toString(36).substring(2, 11)}`;
}

export function calculateEqualSplit(amount: number, participants: number): number {
  return Math.round(amount / participants);
}

export function calculatePercentage(amount: number, percentage: number): number {
  return Math.round((amount * percentage) / 100);
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Simple toast notification system
type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

let toastCallback: ((toasts: Toast[]) => void) | null = null;

export function registerToastCallback(callback: (toasts: Toast[]) => void) {
  toastCallback = callback;
}

export function showToast(message: string, type: ToastType = 'info') {
  if (!toastCallback) return;

  const id = generateId('toast_');
  const newToast: Toast = { id, message, type };

  // Update toasts
  const currentToasts: Toast[] = [];
  toastCallback([...currentToasts, newToast]);

  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    if (toastCallback) {
      // Use setTimeout to avoid type issues
      toastCallback([]);
    }
  }, 3000);
}
