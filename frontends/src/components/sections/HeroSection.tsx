'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Play, Star, CheckCircle2 } from 'lucide-react';
import { Button } from '../ui/Button';
import type { HeroCMS } from '@/lib/homepage-types';

type StatItem = { label: string; value: string; suffix?: string; raw?: number };

export default function HeroSection({
  cms,
  statItems,
  stats,
}: {
  cms?: HeroCMS;
  statItems?: StatItem[];
  stats?: Record<string, number>;
}) {
  if (!cms?.headline) return null;

  const headline = cms.headline;
  const subheadline = cms.subheadline || '';
  const ctaText = cms.ctaText || '';
  const ctaHref = cms.ctaHref || '/';
  const badge = cms.badge || '';
  const secondaryCtaText = cms.secondaryCtaText || '';
  const secondaryCtaHref = cms.secondaryCtaHref || '/';
  const heroImage = cms.heroImage || '';
  const accentCount = cms.accentWordCount ?? 2;
  const heroStats = statItems?.length
    ? statItems.slice(0, 4).map((s) => ({ value: `${s.value}${s.suffix || ''}`, label: s.label }))
    : [];
  const overlayRating = stats?.averageRating ? stats.averageRating.toFixed(1) : cms?.overlayRating || '';
  const overlayRatingLabel =
    stats?.totalReviews && stats.totalReviews > 0
      ? `${stats.totalReviews.toLocaleString('en-IN')}+ Reviews`
      : cms?.overlayRatingLabel || '';

  const words = headline.trim().split(/\s+/);
  const accent = words.length > accentCount ? words.slice(-accentCount).join(' ') : words[words.length - 1] || '';
  const lead = words.length > accentCount ? words.slice(0, -accentCount).join(' ') : words.slice(0, -1).join(' ');

  const showOverlay = cms.showOverlay !== false && (cms.overlayCardTitle || overlayRating);

  return (
    <section className="surface-dark relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={heroImage} alt="" className="h-full w-full object-cover opacity-25" />
        ) : null}
        <div className="absolute inset-0" style={{ backgroundImage: 'var(--gradient-hero)' }} />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-16 md:px-6 md:py-24 lg:py-28">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="flex max-w-2xl flex-col items-start gap-5 sm:gap-6">
            {badge ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-400)]/40 bg-[var(--brand-400)]/10 px-3.5 py-1.5 text-xs font-semibold text-[var(--brand-300)] sm:text-sm">
                {badge}
              </span>
            ) : null}

            <h1 className="text-[1.9rem] font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.4rem]">
              {lead && accent ? (
                <>
                  {lead} <span style={{ color: 'var(--brand-400)' }}>{accent}</span>
                </>
              ) : (
                headline
              )}
            </h1>

            {subheadline ? (
              <p className="max-w-xl text-base leading-relaxed text-muted-on-dark sm:text-lg">{subheadline}</p>
            ) : null}

            {(ctaText || secondaryCtaText) && (
              <div className="flex w-full flex-col items-stretch gap-3 pt-1 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                {ctaText ? (
                  <Link href={ctaHref} className="w-full sm:w-auto">
                    <Button size="lg" variant="brand" rightIcon={<ArrowRight className="h-5 w-5 shrink-0" />} className="w-full sm:w-auto">
                      {ctaText}
                    </Button>
                  </Link>
                ) : null}
                {secondaryCtaText ? (
                  <Link href={secondaryCtaHref} className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" leftIcon={<Play className="h-5 w-5 shrink-0" />} className="w-full border-white/25 text-white hover:bg-white/10 sm:w-auto">
                      {secondaryCtaText}
                    </Button>
                  </Link>
                ) : null}
              </div>
            )}

            {heroStats.length > 0 && (
              <div className="grid w-full grid-cols-2 gap-x-4 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-4 sm:gap-6">
                {heroStats.map((s) => (
                  <StatItem key={s.label} value={s.value} label={s.label} />
                ))}
              </div>
            )}
          </div>

          {(heroImage || showOverlay) && (
            <div className="relative hidden h-[480px] w-full lg:block">
              {heroImage ? (
                <div className="absolute inset-0 overflow-hidden rounded-[var(--radius-2xl)] shadow-[var(--shadow-elevated)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroImage} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </div>
              ) : null}

              {cms.overlayCardTitle ? (
                <div className="absolute -bottom-6 -left-6 w-[78%] rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-elevated)]">
                  <h3 className="mb-1 text-base font-bold text-[var(--text-primary)]">{cms.overlayCardTitle}</h3>
                  {cms.overlayCardDescription ? (
                    <p className="mb-4 line-clamp-2 text-sm text-[var(--text-secondary)]">{cms.overlayCardDescription}</p>
                  ) : null}
                  {cms.overlayProgressLabel ? (
                    <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-base)] p-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--success-bg)] text-[var(--success)]">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{cms.overlayProgressLabel}</p>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
                          <div className="h-full rounded-full" style={{ width: `${cms.overlayProgress ?? 0}%`, background: 'var(--gradient-brand)' }} />
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {overlayRating ? (
                <div className="absolute -right-4 top-8 flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-3 shadow-[var(--shadow-elevated)]">
                  {(cms.overlayAvatarCount ?? 0) > 0 ? (
                    <div className="flex -space-x-2">
                      {Array.from({ length: cms.overlayAvatarCount ?? 4 }).map((_, i) => (
                        <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[var(--navy-800)] text-[10px] font-bold text-white">
                          U{i + 1}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <div>
                    <p className="flex items-center gap-1 text-sm font-bold text-[var(--text-primary)]">
                      {overlayRating} <Star className="h-3 w-3 fill-amber-400 text-amber-600" />
                    </p>
                    {overlayRatingLabel ? (
                      <p className="text-xs text-[var(--text-muted)]">{overlayRatingLabel}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xl font-bold leading-none text-white sm:text-2xl md:text-3xl">{value}</p>
      <p className="text-xs font-medium leading-snug text-muted-on-dark sm:text-sm">{label}</p>
    </div>
  );
}
