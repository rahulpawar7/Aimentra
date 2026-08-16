import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="mb-8 space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex flex-wrap items-center gap-y-1 text-sm font-medium text-[var(--text-muted)]">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              {item.href ? (
                <Link href={item.href} className="max-w-[40vw] truncate transition-colors hover:text-[var(--brand-700)] sm:max-w-none">
                  {item.label}
                </Link>
              ) : (
                <span className="max-w-[50vw] truncate text-[var(--text-secondary)] sm:max-w-none">{item.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="mx-1.5 h-4 w-4 shrink-0 sm:mx-2" />
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title & Action */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[var(--text-secondary)] mt-1.5">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
