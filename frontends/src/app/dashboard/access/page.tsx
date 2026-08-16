'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Check, Video, FileText, Users, Award } from 'lucide-react';
import Link from 'next/link';
import { getMyEntitlements, getPlans } from '@/lib/services';
import { formatCurrency, formatDate } from '@/lib/utils';

const FEATURE_MAP = [
  { key: 'course.access', name: 'Access to Courses', icon: Video },
  { key: 'pdf.download', name: 'Source Code & Downloads', icon: FileText },
  { key: 'community.access', name: 'Community Access', icon: Users },
  { key: 'certificate.generate', name: 'Certificates of Completion', icon: Award },
  { key: 'support.priority', name: 'Priority Support', icon: Shield },
];

export default function AccessPage() {
  const { data: entitlements } = useQuery({ queryKey: ['my-entitlements'], queryFn: getMyEntitlements });
  const { data: plans } = useQuery({ queryKey: ['public-plans'], queryFn: getPlans });

  const activeEntitlement = entitlements?.find((e: any) => e.status === 'active');
  const activePlan = activeEntitlement?.planId;
  const activePlanId = activePlan?._id;

  const hasFeature = (plan: any, featureKey: string) => {
    if (plan?.allCourses && featureKey === 'course.access') return true;
    return (plan?.features || []).some((f: string) => f.includes(featureKey.split('.')[0]));
  };

  return (
    <div className="space-y-8 animate-fade-up max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Access & Plans</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage your subscriptions and entitlements.</p>
      </div>

      {activePlan ? (
        <div className="glass-card p-6 md:p-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{activePlan.name} Plan</h2>
                <span className="badge badge-success">Active</span>
              </div>
              <p className="text-[var(--text-secondary)] mb-4">
                {activeEntitlement?.lifetime
                  ? 'You have lifetime access to all included content.'
                  : activeEntitlement?.expiryDate
                  ? `Expires on ${formatDate(activeEntitlement.expiryDate)}`
                  : 'Your subscription is active.'}
              </p>
              <ul className="space-y-2">
                {(activePlan.highlights || activePlan.features || []).slice(0, 5).map((f: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-[var(--brand-700)]" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/packages" className="btn-brand py-3 px-6 shadow-lg">Upgrade / Renew</Link>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <Shield className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No Active Plan</h3>
          <p className="text-[var(--text-secondary)] mb-4">Purchase a plan to unlock premium courses and features.</p>
          <Link href="/packages" className="btn-brand">View Plans</Link>
        </div>
      )}

      <div className="pt-4">
        <h2 className="text-xl font-bold mb-6 text-center">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(plans ?? []).map((plan: any) => (
            <div key={plan._id} className={`glass-card p-6 relative ${plan._id === activePlanId ? 'border-[var(--brand-500)]' : ''}`}>
              {plan.featured && <span className="absolute -top-3 right-4 bg-gradient-brand text-[var(--navy-900)] text-xs font-bold px-3 py-1 rounded-full">{plan.badge || 'Popular'}</span>}
              <h3 className="font-bold text-lg">{plan.name}</h3>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-extrabold">{plan.price === 0 ? 'Free' : formatCurrency(plan.price)}</span>
                <span className="text-[var(--text-muted)]">{plan.lifetime ? ' lifetime' : plan.billingType === 'annual' ? '/yr' : ''}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {FEATURE_MAP.map((f) => (
                  <li key={f.key} className="flex items-center gap-2 text-sm">
                    {hasFeature(plan, f.key) ? <Check className="w-4 h-4 text-green-600" /> : <span className="w-4 h-4" />}
                    <span className={hasFeature(plan, f.key) ? '' : 'text-[var(--text-muted)] line-through'}>{f.name}</span>
                  </li>
                ))}
              </ul>
              {plan._id === activePlanId ? (
                <button className="w-full py-2.5 rounded-lg bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-not-allowed" disabled>Current Plan</button>
              ) : (
                <Link href={`/checkout?plan=${plan.slug}`} className="btn-brand block w-full py-2.5 text-center rounded-lg">Select Plan</Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
