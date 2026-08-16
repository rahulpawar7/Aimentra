'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, LayoutTemplate, CreditCard, Shield } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-[var(--text-secondary)] mt-1">Configure your LMS platform.</p>
      </div>

      <div className="grid gap-4">
        {[
          { href: '/admin/cms', icon: LayoutTemplate, title: 'Website CMS', desc: 'Edit homepage hero, stats, FAQ, footer, and legal pages.' },
          { href: '/admin/plans', icon: CreditCard, title: 'Subscription Plans', desc: 'Manage pricing tiers and feature entitlements.' },
          { href: '/admin/coupons', icon: Settings, title: 'Coupons & Promotions', desc: 'Create and manage discount codes.' },
          { href: '/admin/logs', icon: Shield, title: 'Audit Logs', desc: 'Review admin actions and system events.' },
        ].map(({ href, icon: Icon, title, desc }) => (
          <Link key={href} href={href} className="glass-card p-5 flex items-center gap-4 hover:border-[var(--brand-500)]/30 transition-colors">
            <div className="p-3 rounded-xl bg-[var(--bg-surface)]"><Icon className="w-6 h-6 text-[var(--brand-700)]" /></div>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-[var(--text-muted)]">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="glass-card p-6">
        <h2 className="font-bold mb-3">Payment Gateway</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-2">
          Razorpay is controlled via the <code className="text-xs bg-[var(--bg-surface)] px-1 rounded">PAYMENT_GATEWAY_ENABLED</code> environment variable on the backend.
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          When disabled (default), orders are auto-completed for instant access. Set to <code className="text-xs">true</code> with Razorpay keys for live payments.
        </p>
      </div>
    </div>
  );
}
