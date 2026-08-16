'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutDashboard, 
  BookOpen, 
  Library, 
  Award, 
  Download, 
  ShoppingBag, 
  Shield, 
  User, 
  Lock, 
  HeadphonesIcon, 
  Bell 
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getUserSubscription } from '@/lib/services';
import { BRAND } from '@/lib/brand';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: BookOpen, label: 'My Courses', href: '/dashboard/courses' },
  { icon: Library, label: 'Library', href: '/dashboard/library' },
  { icon: Award, label: 'Certificates', href: '/dashboard/certificates' },
  { icon: Download, label: 'Downloads', href: '/dashboard/downloads' },
  { icon: ShoppingBag, label: 'My Orders', href: '/dashboard/orders' },
  { icon: Shield, label: 'My Access', href: '/dashboard/access' },
  { icon: User, label: 'Profile', href: '/dashboard/profile' },
  { icon: Lock, label: 'Security', href: '/dashboard/security' },
  { icon: HeadphonesIcon, label: 'Support', href: '/dashboard/support' },
  { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const { data: subscription } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: getUserSubscription,
    enabled: !!user,
  });

  const planLabel = subscription?.plan?.name || subscription?.planName || 'Free Plan';

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-[240px] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] z-50 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-[var(--border-subtle)]">
          <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-[var(--brand-500)] text-xs font-extrabold text-[var(--navy-900)]">
              {BRAND.monogram}
            </div>
            <span className="text-base font-extrabold tracking-tight text-[var(--navy-900)]">{BRAND.nameUpper}</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-[var(--brand-500)]/10 text-[var(--brand-700)] border-l-2 border-[var(--brand-400)]' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'}
                `}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[var(--brand-700)]' : 'text-[var(--text-muted)]'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-elevated)]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--navy-800)] flex items-center justify-center text-white font-bold">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{user?.email || 'user@example.com'}</p>
            </div>
          </div>
          <div className="mt-3">
            <span className="badge badge-brand w-full justify-center text-xs">{planLabel}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
