// ToastContainer Component
'use client';

import { useEffect, useState } from 'react';
import { registerToastCallback } from '@/lib/utils';
import { XCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const toastStyles = {
  success: 'bg-green-500 text-white border-black',
  error: 'bg-red-600 text-white border-black',
  info: 'bg-[#F5E600] text-black border-black',
  warning: 'bg-[#FF5A1F] text-white border-black',
};

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    registerToastCallback(setToasts);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => {
        const Icon = toastIcons[toast.type];
        const style = toastStyles[toast.type];

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 font-bold uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${style}`}
          >
            <Icon size={20} />
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-lg font-bold"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
