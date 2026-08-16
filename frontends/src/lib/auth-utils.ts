export const ADMIN_ROLES = [
  'admin',
  'super_admin',
  'content_manager',
  'finance_manager',
  'support_agent',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role?: string | null): boolean {
  return !!role && ADMIN_ROLES.includes(role as AdminRole);
}

/** Where to send the user after login */
export function getPostLoginRedirect(role?: string | null, redirectParam?: string | null): string {
  if (redirectParam && redirectParam.startsWith('/')) {
    // Always honor checkout and explicit deep links
    if (redirectParam.includes('/checkout')) return redirectParam;
    if (redirectParam !== '/dashboard' && redirectParam !== '/admin') {
      return redirectParam;
    }
  }
  return isAdminRole(role) ? '/admin' : '/dashboard';
}

/** Build checkout URL preserving plan id or slug */
export function buildCheckoutUrl(params: { planId?: string; planSlug?: string }): string {
  const q = new URLSearchParams();
  if (params.planId) q.set('planId', params.planId);
  else if (params.planSlug) q.set('plan', params.planSlug);
  const query = q.toString();
  return query ? `/checkout?${query}` : '/checkout';
}

export function buildLoginUrl(returnTo?: string | null): string {
  if (!returnTo) return '/login';
  return `/login?redirect=${encodeURIComponent(returnTo)}`;
}

export function buildRegisterUrl(returnTo?: string | null): string {
  if (!returnTo) return '/register';
  return `/register?redirect=${encodeURIComponent(returnTo)}`;
}

/** Entry point when user selects a plan — auth-aware */
export function getPlanPurchaseUrl(
  planId: string,
  isAuthenticated: boolean,
  options?: { isFree?: boolean; planSlug?: string }
): string {
  const checkout = buildCheckoutUrl({ planId, planSlug: options?.planSlug });
  if (isAuthenticated) return checkout;
  if (options?.isFree) return buildRegisterUrl(checkout);
  return buildLoginUrl(checkout);
}

/** Primary app home for the current role */
export function getAppHome(role?: string | null): string {
  return isAdminRole(role) ? '/admin' : '/dashboard';
}
