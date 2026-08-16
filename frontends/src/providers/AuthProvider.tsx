'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const bootstrapSession = useAuthStore((s) => s.bootstrapSession);

  useEffect(() => {
    const runBootstrap = () => bootstrapSession();

    if (useAuthStore.persist.hasHydrated()) {
      runBootstrap();
      return;
    }

    return useAuthStore.persist.onFinishHydration(runBootstrap);
  }, [bootstrapSession]);

  return <>{children}</>;
}
