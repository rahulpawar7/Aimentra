'use client';

import Link from 'next/link';
import { Play, MessageCircle, Send, ExternalLink } from 'lucide-react';
import { isAdminRole } from '@/lib/auth-utils';
import { useAuthStore } from '@/store/auth.store';
import { BRAND } from '@/lib/brand';

type FooterCMS = {
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  tagline?: string;
  socialLinks?: { youtube?: string; instagram?: string; linkedin?: string; whatsapp?: string; telegram?: string };
};

export default function Footer({ cms }: { cms?: FooterCMS }) {
  const { user } = useAuthStore();
  const social = [
    { icon: Play, label: 'YouTube', href: cms?.socialLinks?.youtube || '#' },
    { icon: MessageCircle, label: 'WhatsApp', href: cms?.socialLinks?.whatsapp || '#' },
    { icon: Send, label: 'Telegram', href: cms?.socialLinks?.telegram || '#' },
    { icon: ExternalLink, label: 'LinkedIn', href: cms?.socialLinks?.linkedin || '#' },
  ];

  const learningHref = isAdminRole(user?.role) ? '/admin' : '/dashboard';
  const learningLabel = isAdminRole(user?.role) ? 'Admin Panel' : 'My Learning';

  return (
    <footer className="surface-dark relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-400)] to-transparent opacity-60" />

      <div className="container mx-auto max-w-6xl px-4 pb-8 pt-12 md:px-6 md:pt-16">
        <div className="mb-10 grid grid-cols-2 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="mb-4 inline-flex items-center gap-2.5 no-underline">
              <div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-[var(--brand-400)] text-sm font-extrabold text-white">{BRAND.monogram}</div>
              <span className="text-xl font-extrabold text-white">{BRAND.nameUpper}</span>
            </Link>
            <p className="mb-5 text-sm leading-relaxed text-muted-on-dark">
              {cms?.tagline || 'Transforming businesses and careers with expert coaching and practical online education.'}
            </p>
            {(cms?.contactEmail || cms?.contactPhone) && (
              <div className="mb-4 space-y-1 text-sm text-muted-on-dark">
                {cms.contactEmail && <p>{cms.contactEmail}</p>}
                {cms.contactPhone && <p>{cms.contactPhone}</p>}
                {cms.address && <p>{cms.address}</p>}
              </div>
            )}
            <div className="flex gap-2.5">
              {social.map(({ icon: Icon, label, href }) => (
                <a key={label} href={href} aria-label={label} target="_blank" rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-[var(--brand-400)] hover:text-[var(--brand-400)]">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Company</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/about', label: 'About Us' },
                { href: '/blog', label: 'Blog' },
                { href: '/events', label: 'Events' },
                { href: '/contact', label: 'Contact' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-on-dark no-underline transition-colors hover:text-[var(--brand-400)]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Learn</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/courses', label: 'All Courses' },
                { href: '/packages', label: 'Packages' },
                { href: learningHref, label: learningLabel },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-on-dark no-underline transition-colors hover:text-[var(--brand-400)]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Support</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/contact', label: 'Help Center' },
                { href: '/privacy', label: 'Privacy' },
                { href: '/terms', label: 'Terms' },
                { href: '/refund', label: 'Refunds' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-on-dark no-underline transition-colors hover:text-[var(--brand-400)]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center text-xs text-muted-on-dark sm:flex-row sm:text-left">
          <p>&copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/privacy" className="hover:text-[var(--brand-400)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--brand-400)]">Terms</Link>
            <Link href="/refund" className="hover:text-[var(--brand-400)]">Refunds</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
