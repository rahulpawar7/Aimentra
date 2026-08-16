import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, BookOpen, Video, ShoppingBag, Settings,
  ShieldCheck, FileText, CreditCard, Ticket, LayoutTemplate, Tag,
  Newspaper, Calendar, MessageSquareQuote, Layers, ExternalLink, HeadphonesIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { BRAND } from '@/lib/brand';

const adminNavSections = [
  {
    title: 'Control Center',
    items: [
      { icon: LayoutDashboard, label: 'CMS Dashboard', href: '/admin' },
      { icon: LayoutTemplate, label: 'Website Content', href: '/admin/cms' },
      { icon: FileText, label: 'Analytics', href: '/admin/analytics' },
    ],
  },
  {
    title: 'End-User Content',
    items: [
      { icon: BookOpen, label: 'Courses', href: '/admin/courses' },
      { icon: Tag, label: 'Categories', href: '/admin/categories' },
      { icon: Newspaper, label: 'Blog Posts', href: '/admin/blog' },
      { icon: Calendar, label: 'Events', href: '/admin/events' },
      { icon: MessageSquareQuote, label: 'Testimonials', href: '/admin/testimonials' },
      { icon: Video, label: 'Media Library', href: '/admin/media' },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { icon: CreditCard, label: 'Plans', href: '/admin/plans' },
      { icon: ShoppingBag, label: 'Orders', href: '/admin/orders' },
      { icon: Ticket, label: 'Coupons', href: '/admin/coupons' },
    ],
  },
  {
    title: 'Users & Access',
    items: [
      { icon: Users, label: 'All Users', href: '/admin/users' },
      { icon: ShieldCheck, label: 'Entitlements', href: '/admin/entitlements' },
      { icon: HeadphonesIcon, label: 'Support', href: '/admin/support' },
      { icon: Layers, label: 'Certificates', href: '/admin/certificates' },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: Settings, label: 'Settings', href: '/admin/settings' },
      { icon: ShieldCheck, label: 'Audit Logs', href: '/admin/logs' },
    ],
  },
];

export function AdminSidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-[260px] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] z-50 flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-16 flex items-center gap-2.5 px-6 border-b border-[var(--border-subtle)]">
          <Link href="/admin" className="flex items-center gap-2.5 no-underline">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-[var(--brand-500)] text-xs font-extrabold text-[var(--navy-900)]">{BRAND.monogram}</div>
            <span className="truncate text-base font-bold text-[var(--navy-900)]">{BRAND.name} Admin</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-6 scrollbar-hide">
          {adminNavSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-2">{section.title}</h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/admin');
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-[var(--brand-500)]/10 text-[var(--brand-700)] border-l-2 border-[var(--brand-500)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]'}`}>
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-[var(--brand-700)]' : 'text-[var(--text-muted)]'}`} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card-hover)] space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[var(--navy-800)] flex items-center justify-center text-white font-bold shadow-md">{user?.name?.[0] || 'A'}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user?.name || 'Admin'}</p>
              <span className="badge badge-warning text-[10px] px-1.5 py-0">ADMIN</span>
            </div>
          </div>
          <Link href="/" target="_blank" className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--brand-700)] px-1">
            <ExternalLink className="w-3.5 h-3.5" /> View Live Site
          </Link>
        </div>
      </aside>
    </>
  );
}
