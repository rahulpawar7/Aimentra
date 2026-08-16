'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import DashboardTopBar from '@/components/layout/DashboardTopBar';
import { useAuthStore } from '@/store/auth.store';
import { isAdminRole } from '@/lib/auth-utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, fetchMe } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) await fetchMe().catch(() => {});
      setChecked(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!isAuthenticated) {
      router.replace('/login?redirect=/dashboard');
      return;
    }
    // Admin users belong in the admin panel, not the student dashboard
    if (user && isAdminRole(user.role)) {
      router.replace('/admin');
    }
  }, [checked, isAuthenticated, user, router]);

  if (!checked || !user || isAdminRole(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="skeleton h-8 w-48 rounded" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)] overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-[240px]">
        <DashboardTopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="page-shell flex-1 overflow-y-auto overflow-x-hidden bg-[var(--bg-base)]">
          {children}
        </main>
      </div>
    </div>
  );
}
