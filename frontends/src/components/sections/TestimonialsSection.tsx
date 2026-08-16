'use client';

import React from 'react';
import { Star, Quote } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import type { TestimonialsSectionCMS } from '@/lib/homepage-types';

export default function TestimonialsSection({
  cms,
  testimonials = [],
}: {
  cms?: TestimonialsSectionCMS;
  testimonials?: any[];
}) {
  if (!cms?.title || testimonials.length === 0) return null;

  const limit = cms.limit || 4;
  const data = testimonials.slice(0, limit).map((t: any, i: number) => ({
    id: t.id || t._id || String(i),
    name: t.name || '',
    role: t.role || t.designation || '',
    company: t.company || '',
    content: t.content || t.quote || '',
    rating: t.rating || 5,
    avatar: t.avatar,
  }));

  return (
    <section className="overflow-x-hidden bg-[var(--bg-surface)] py-12 sm:py-16 md:py-20">
      <div className="container mx-auto mb-8 max-w-6xl px-4 text-center sm:mb-10 md:px-6">
        <h2 className="mb-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl md:text-4xl">
          {cms.title}{' '}
          {cms.titleAccent ? <span className="gradient-text">{cms.titleAccent}</span> : null}
        </h2>
        {cms.subtitle ? (
          <p className="mx-auto max-w-2xl text-sm text-[var(--text-secondary)] sm:text-base md:text-lg">{cms.subtitle}</p>
        ) : null}
      </div>

      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {data.map((t) => (
            <article key={t.id} className="relative flex h-full flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sm:p-6">
              <Quote className="absolute right-4 top-4 h-8 w-8 text-[var(--brand-500)]/15" />
              <div className="mb-4 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.floor(t.rating) ? 'fill-amber-400 text-amber-600' : 'text-[var(--border-strong)]'}`}
                  />
                ))}
              </div>
              <p className="mb-5 flex-1 text-sm leading-relaxed text-[var(--text-primary)] sm:text-[15px]">"{t.content}"</p>
              <div className="mt-auto flex min-w-0 items-center gap-3">
                <Avatar src={t.avatar} alt={t.name} size="sm" />
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold text-[var(--text-primary)]">{t.name}</h4>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {t.role}
                    {t.company ? `, ${t.company}` : ''}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
