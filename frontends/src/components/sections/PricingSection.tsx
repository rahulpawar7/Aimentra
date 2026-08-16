'use client';

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { PlanCard, Plan } from '../common/PlanCard';
import type { PricingSectionCMS } from '@/lib/homepage-types';

interface PricingSectionProps {
  cms?: PricingSectionCMS;
  plans: Plan[];
}

export default function PricingSection({ cms, plans = [] }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'lifetime'>('annual');

  if (!cms?.title || plans.length === 0) return null;

  const showToggle = cms.showBillingToggle !== false;

  return (
    <section className="relative overflow-x-hidden bg-[var(--bg-base)] py-12 sm:py-16 md:py-20">
      <div className="container relative z-10 mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:mb-4 sm:text-3xl md:text-4xl">
            {cms.title}
          </h2>
          {cms.subtitle ? (
            <p className="mb-6 text-sm text-[var(--text-secondary)] sm:text-base md:text-lg">{cms.subtitle}</p>
          ) : null}

          {showToggle ? (
            <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1 shadow-[var(--shadow-card)]">
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`rounded-full px-3 py-2 text-xs font-medium transition-all sm:px-5 sm:text-sm ${
                  billingCycle === 'annual'
                    ? 'bg-[var(--brand-500)] text-[var(--navy-900)] shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cms.annualLabel || 'Annual'}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('lifetime')}
                className={`rounded-full px-3 py-2 text-xs font-medium transition-all sm:px-5 sm:text-sm ${
                  billingCycle === 'lifetime'
                    ? 'bg-[var(--brand-500)] text-[var(--navy-900)] shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {cms.lifetimeLabel || 'Lifetime'}{' '}
                {cms.lifetimeBadge ? (
                  <span className="ml-1 rounded-full bg-[var(--navy-800)] px-1.5 py-0.5 text-[9px] text-white sm:text-[10px]">
                    {cms.lifetimeBadge}
                  </span>
                ) : null}
              </button>
            </div>
          ) : null}
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, idx) => (
            <PlanCard key={plan.id || plan._id || `plan-${idx}`} plan={plan} featured={idx === 1 || !!plan.featured} />
          ))}
        </div>

        {cms.guaranteeTitle ? (
          <div className="mt-10 flex justify-center sm:mt-14">
            <div className="flex w-full max-w-xl items-start gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 shadow-[var(--shadow-card)] sm:items-center sm:gap-4 sm:px-6 sm:py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--success-bg)] sm:h-12 sm:w-12">
                <ShieldCheck className="h-5 w-5 text-[var(--success)] sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-[var(--text-primary)] sm:text-base">{cms.guaranteeTitle}</h4>
                {cms.guaranteeText ? (
                  <p className="text-xs text-[var(--text-secondary)] sm:text-sm">{cms.guaranteeText}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
