'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminTopBar } from '@/components/layout/AdminTopBar';
import { useAuthStore } from '@/store/auth.store';
import { isAdminRole } from '@/lib/auth-utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, isAuthenticated, fetchMe } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    (async () => {
      if (!user) {
        await fetchMe().catch(() => {});
      }
      setChecked(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!isAuthenticated || !user || !isAdminRole(user.role)) {
      router.replace('/login?redirect=/admin');
    }
  }, [checked, isAuthenticated, user, router]);

  if (!checked || !user || !isAdminRole(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="skeleton h-8 w-48 rounded" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <AdminSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-[260px]">
        <AdminTopBar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="page-shell flex-1 overflow-y-auto overflow-x-hidden bg-[var(--bg-base)]">
          {children}
        </main>
      </div>
    </div>
  );
}
