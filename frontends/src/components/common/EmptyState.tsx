import React from 'react';
import { Search, PackageOpen, Bell, ShoppingBag, FolderSearch } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';

type EmptyStateType = 'courses' | 'orders' | 'notifications' | 'search' | 'generic';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  type = 'generic',
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  
  const config = {
    courses: {
      defaultIcon: <PackageOpen className="w-12 h-12 text-[var(--brand-700)] opacity-80" />,
      defaultTitle: 'No courses found',
      defaultDescription: "You haven't enrolled in any courses yet. Explore our catalog to get started.",
    },
    orders: {
      defaultIcon: <ShoppingBag className="w-12 h-12 text-[var(--brand-700)] opacity-80" />,
      defaultTitle: 'No orders yet',
      defaultDescription: "You don't have any purchase history at the moment.",
    },
    notifications: {
      defaultIcon: <Bell className="w-12 h-12 text-[var(--brand-700)] opacity-80" />,
      defaultTitle: "You're all caught up",
      defaultDescription: "There are no new notifications to show here.",
    },
    search: {
      defaultIcon: <Search className="w-12 h-12 text-[var(--brand-700)] opacity-80" />,
      defaultTitle: 'No results found',
      defaultDescription: "We couldn't find anything matching your search. Try adjusting your filters.",
    },
    generic: {
      defaultIcon: <FolderSearch className="w-12 h-12 text-[var(--brand-700)] opacity-80" />,
      defaultTitle: 'Nothing to see here',
      defaultDescription: "There is no data available to display at this time.",
    }
  };

  const currentConfig = config[type];

  return (
    <div className={cn('flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 text-center sm:p-12', className)}>
      <div className="w-20 h-20 rounded-full bg-[var(--brand-500)]/10 flex items-center justify-center mb-6">
        {icon || currentConfig.defaultIcon}
      </div>
      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        {title || currentConfig.defaultTitle}
      </h3>
      <p className="text-[var(--text-secondary)] max-w-md mb-8 leading-relaxed">
        {description || currentConfig.defaultDescription}
      </p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="brand">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
