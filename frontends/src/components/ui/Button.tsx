import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'brand' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'brand',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-[var(--transition-default)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)] disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden';

    const variants = {
      brand:
        'bg-[image:var(--gradient-brand)] text-[var(--navy-900)] font-bold shadow-[var(--shadow-glow-sm)] hover:shadow-[var(--shadow-glow)] active:scale-95',
      outline:
        'border-[1.5px] border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] hover:border-[var(--brand-500)] hover:bg-[var(--bg-card-hover)] active:scale-95',
      ghost:
        'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] active:scale-95',
      destructive:
        'bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 active:scale-95',
    };

    const sizes = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-14 px-8 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {/* Sheen effect on hover for brand variant */}
        {variant === 'brand' && (
          <div className="absolute inset-0 rounded-inherit bg-white/25 opacity-0 transition-opacity hover:opacity-100" />
        )}
        {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {!loading && leftIcon && <span className="inline-flex shrink-0 mr-2 items-center">{leftIcon}</span>}
        <span className="inline-flex items-center leading-none">{children}</span>
        {!loading && rightIcon && <span className="inline-flex shrink-0 ml-2 items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
