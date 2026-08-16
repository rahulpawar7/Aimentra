'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Tag } from 'lucide-react';
import type { CategoriesCMS } from '@/lib/homepage-types';

type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: string;
  courseCount?: number;
};

export default function CategoriesSection({
  cms,
  categories = [],
}: {
  cms?: CategoriesCMS;
  categories?: Category[];
}) {
  if (!cms?.title || categories.length === 0) return null;

  return (
    <section className="bg-[var(--bg-base)] py-12 sm:py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl md:text-4xl">
              {cms.title}{' '}
              {cms.titleAccent ? (
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'var(--gradient-brand)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                  }}
                >
                  {cms.titleAccent}
                </span>
              ) : null}
            </h2>
            {cms.subtitle ? (
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">{cms.subtitle}</p>
            ) : null}
          </div>
          {cms.ctaText && cms.ctaHref ? (
            <Link
              href={cms.ctaHref}
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[var(--border-strong)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]"
            >
              {cms.ctaText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat._id}
              href={`/courses?category=${cat.slug}`}
              className="group flex flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition-colors hover:border-[var(--brand-500)]/40 sm:p-5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-500)]/10 text-[var(--brand-700)]">
                {cat.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cat.image} alt="" className="h-6 w-6 object-contain" />
                ) : (
                  <Tag className="h-5 w-5" />
                )}
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-700)]">{cat.name}</h3>
              {cat.description ? (
                <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)] sm:text-sm">{cat.description}</p>
              ) : null}
              {typeof cat.courseCount === 'number' ? (
                <p className="mt-auto pt-3 text-xs font-medium text-[var(--text-secondary)]">{cat.courseCount} courses</p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
