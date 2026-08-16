import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'brand' | 'success' | 'warning' | 'error' | 'info' | 'default';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    brand: 'bg-[var(--brand-500)]/10 text-[var(--brand-700)] border border-[var(--brand-500)]/25',
    success: 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-700 border border-amber-500/20',
    error: 'bg-red-500/10 text-red-700 border border-red-500/20',
    info: 'bg-blue-500/10 text-blue-700 border border-blue-500/20',
    default: 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
