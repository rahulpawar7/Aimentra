'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useAuthSession } from '@/hooks/useAuthSession';
import { getPlanPurchaseUrl } from '@/lib/auth-utils';

export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface Plan {
  id?: string;
  _id?: string;
  name: string;
  badge?: string;
  price: number;
  originalPrice?: number;
  compareAtPrice?: number;
  durationLabel?: string;
  durationDays?: number;
  lifetime?: boolean;
  features?: any[];
  highlights?: string[];
  lockedFeatures?: string[];
  color?: string;
  featured?: boolean;
}

export interface PlanCardProps {
  plan?: any;
  featured?: boolean;
  onSelect?: (planId: string) => void;
  className?: string;
}

export function PlanCard({ plan, featured, onSelect, className }: PlanCardProps) {
  const router = useRouter();
  const { isAuthenticated, authReady } = useAuthSession();

  if (!plan) return null;

  const id = plan._id || plan.id;
  const name = plan.name;
  const badge = plan.badge;
  const price = plan.price ?? 0;
  const originalPrice = plan.compareAtPrice || plan.originalPrice;
  const durationLabel = plan.durationLabel || (plan.lifetime ? 'Lifetime' : `${plan.durationDays || 365} Days`);
  const isFeatured = featured || plan.featured;

  // Build normalized list of features
  let featureList: PlanFeature[] = [];
  if (Array.isArray(plan.features) && plan.features.length > 0) {
    if (typeof plan.features[0] === 'object' && plan.features[0] !== null) {
      featureList = plan.features.map((f: any) => ({
        name: f.name || f.label || String(f),
        included: f.included !== false,
      }));
    } else {
      featureList = plan.features.map((f: any) => ({
        name: String(f),
        included: true,
      }));
    }
  } else if (Array.isArray(plan.highlights)) {
    featureList = [
      ...plan.highlights.map((h: string) => ({ name: h, included: true })),
      ...(Array.isArray(plan.lockedFeatures) ? plan.lockedFeatures.map((l: string) => ({ name: l, included: false })) : []),
    ];
  }

  const discountPercent = originalPrice && price < originalPrice 
    ? Math.round(((originalPrice - price) / originalPrice) * 100) 
    : 0;

  const handleSelect = () => {
    if (!id) return;
    onSelect?.(id);
    if (!authReady) return;
    const url = getPlanPurchaseUrl(id, isAuthenticated, {
      isFree: price === 0,
      planSlug: plan.slug,
    });
    router.push(url);
  };

  return (
    <div
      className={cn(
        'relative flex h-full flex-col rounded-2xl border bg-[var(--bg-card)] transition-all duration-300',
        isFeatured
          ? 'border-[var(--brand-500)] shadow-[0_10px_30px_-5px_rgba(193,146,42,0.3)]'
          : 'border-[var(--border-subtle)] shadow-[var(--shadow-card)] hover:border-[var(--border-default)]',
        className
      )}
    >
      {isFeatured && (
        <div className="absolute -top-3 left-0 right-0 z-10 flex justify-center">
          <Badge variant="brand" className="border-none bg-[var(--brand-500)] px-3 py-1 text-xs text-[var(--navy-900)] shadow-lg sm:text-sm">
            {badge || 'MOST POPULAR'}
          </Badge>
        </div>
      )}
      {!isFeatured && badge && (
        <div className="absolute right-3 top-3 z-10">
          <Badge variant="info">{badge}</Badge>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6 md:p-8">
        <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)] sm:text-xl">{name}</h3>

        <div className="my-4 sm:my-6">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-[var(--text-muted)] line-through sm:text-lg">
                {formatCurrency(originalPrice)}
              </span>
            )}
            {discountPercent > 0 && (
              <Badge variant="success" className="bg-[var(--success-bg)] text-[var(--success)]">
                Save {discountPercent}%
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-baseline gap-1">
            <span className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {price === 0 ? 'FREE' : formatCurrency(price)}
            </span>
            {price > 0 && (
              <span className="text-xs font-medium text-[var(--text-secondary)] sm:text-sm">
                / {durationLabel}
              </span>
            )}
          </div>
        </div>

        <Button
          variant={isFeatured ? 'brand' : 'outline'}
          size="lg"
          className="mb-6 w-full text-sm font-semibold sm:mb-8 sm:text-base"
          onClick={handleSelect}
          disabled={!authReady}
        >
          Get Started
        </Button>

        <div className="mb-6 h-px w-full bg-[var(--border-subtle)] sm:mb-8" />

        <ul className="flex-1 space-y-3 sm:space-y-4">
          {featureList.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              {feature.included ? (
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--success-bg)]">
                  <Check className="h-3 w-3 text-[var(--success)]" />
                </div>
              ) : (
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center opacity-40">
                  <X className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
              )}
              <span
                className={cn(
                  'text-sm leading-snug',
                  feature.included
                    ? 'text-[var(--text-secondary)]'
                    : 'text-[var(--text-muted)] line-through opacity-70'
                )}
              >
                {feature.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default PlanCard;
