'use client';

import { Toaster, toast as hotToast } from 'react-hot-toast';
import { Check, X, Loader2, Info } from 'lucide-react';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        className: '',
        style: {
          background: 'var(--bg-elevated)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-elevated)',
          padding: '12px 16px',
        },
        success: {
          icon: <Check className="w-5 h-5 text-emerald-600" />,
          style: {
            borderLeft: '4px solid #34d399',
          }
        },
        error: {
          icon: <X className="w-5 h-5 text-red-600" />,
          style: {
            borderLeft: '4px solid #f87171',
          }
        },
        loading: {
          icon: <Loader2 className="w-5 h-5 text-[var(--brand-700)] animate-spin" />,
        },
      }}
    />
  );
}

export const toast = {
  success: (message: string) => hotToast.success(message),
  error: (message: string) => hotToast.error(message),
  loading: (message: string) => hotToast.loading(message),
  info: (message: string) => hotToast(message, { icon: <Info className="w-5 h-5 text-blue-600" /> }),
  dismiss: () => hotToast.dismiss(),
};
