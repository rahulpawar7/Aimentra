'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';

/**
 * Reliable auth state that waits for Zustand persist hydration + session bootstrap.
 * Use this instead of raw isAuthenticated for purchase / redirect decisions.
 */
export function useAuthSession() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  const ready = hydrated && authReady;
  const loggedIn = ready && isAuthenticated && !!user;

  return {
    user,
    isAuthenticated: loggedIn,
    authReady: ready,
    isLoading: !ready || isLoading,
  };
}
