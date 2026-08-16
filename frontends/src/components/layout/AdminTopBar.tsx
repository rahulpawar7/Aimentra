import React from 'react';
import { Menu, Search, Bell, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function AdminTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  
  // Simple breadcrumb logic based on pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    return {
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      isLast: index === pathSegments.length - 1
    };
  });

  return (
    <header className="h-16 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-md"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        {/* Breadcrumbs */}
        <div className="hidden md:flex items-center text-sm font-medium">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span className={`${crumb.isLast ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                {crumb.name}
              </span>
              {!crumb.isLast && <span className="text-[var(--text-muted)] mx-2">/</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative group">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="input-base pl-9 py-1.5 h-9 w-64 bg-[var(--bg-surface)] focus:w-80 transition-all duration-300 text-sm"
          />
        </div>

        <button className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--brand-700)] rounded-full transition-colors bg-[var(--bg-card-hover)]">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-[var(--bg-surface)]"></span>
        </button>

        <button className="flex items-center gap-2 p-1 hover:bg-[var(--bg-card-hover)] rounded-md transition-colors">
          <div className="w-8 h-8 rounded-md bg-[var(--navy-800)] flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0] || 'A'}
          </div>
          <ChevronDown className="w-4 h-4 text-[var(--text-muted)] hidden sm:block" />
        </button>
      </div>
    </header>
  );
}
