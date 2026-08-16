'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Star, Clock, BookOpen } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { FeaturedCoursesCMS } from '@/lib/homepage-types';

type Course = {
  _id?: string;
  id?: string;
  slug?: string;
  title: string;
  thumbnail?: string;
  category?: string | { name?: string };
  instructorName?: string;
  totalDuration?: number;
  lessonCount?: number;
  rating?: number;
  price?: number;
  compareAtPrice?: number;
};

function categoryLabel(category: Course['category']) {
  if (!category) return '';
  if (typeof category === 'string') return category;
  return category.name || '';
}

function MiniCard({ course }: { course: Course }) {
  const href = `/courses/${course.slug || course._id || course.id}`;
  const price = course.price ?? 0;
  const compare = course.compareAtPrice;
  const mins = course.totalDuration || 0;
  const duration = `${Math.floor(mins / 60)}h ${mins % 60}m`;

  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] transition-colors hover:border-[var(--brand-500)]/40"
    >
      <div className="relative w-full overflow-hidden bg-[var(--bg-elevated)]" style={{ aspectRatio: '16 / 9' }}>
        {course.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnail} alt={course.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-elevated)] text-[var(--text-muted)]">
            <BookOpen className="h-8 w-8 opacity-40" />
          </div>
        )}
        {categoryLabel(course.category) ? (
          <span className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {categoryLabel(course.category)}
          </span>
        ) : null}
      </div>

      <div className="p-3 sm:p-3.5">
        <h3 className="min-h-[2.5rem] line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)] sm:text-[15px]">
          {course.title}
        </h3>

        <div className="mt-2 hidden items-center gap-3 text-[11px] text-[var(--text-muted)] sm:flex">
          {mins > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {duration}
            </span>
          ) : null}
          {course.lessonCount ? (
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> {course.lessonCount}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-2.5">
          {course.rating ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-primary)]">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-600" />
              {course.rating.toFixed(1)}
            </span>
          ) : <span />}
          <span className="text-right">
            {compare && compare > price ? (
              <span className="mr-1.5 text-[10px] text-[var(--text-muted)] line-through">{formatCurrency(compare)}</span>
            ) : null}
            <span className="text-sm font-bold text-[var(--text-primary)]">{price === 0 ? 'Free' : formatCurrency(price)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedCourses({ cms, courses = [] }: { cms?: FeaturedCoursesCMS; courses?: Course[] }) {
  if (!cms?.title || courses.length === 0) return null;

  const limit = cms.limit || 4;
  const list = courses.slice(0, limit);

  return (
    <section data-section="featured-courses" className="bg-[var(--bg-surface)] py-12 sm:py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 max-w-2xl">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl md:text-4xl">
              {cms.title}{' '}
              {cms.titleAccent ? (
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
                  {cms.titleAccent}
                </span>
              ) : null}
            </h2>
            {cms.subtitle ? <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">{cms.subtitle}</p> : null}
          </div>
          {cms.ctaText && cms.ctaHref ? (
            <Link href={cms.ctaHref} className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[var(--border-strong)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]">
              {cms.ctaText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {list.map((course) => (
            <MiniCard key={course._id || course.id || course.slug} course={course} />
          ))}
        </div>
      </div>
    </section>
  );
}
