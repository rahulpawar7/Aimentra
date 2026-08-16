'use client';

import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, BookOpen, Clock, Users, Star, ChevronRight } from 'lucide-react';
import { formatDuration, formatCurrency, calculateDiscount } from '@/lib/utils';
import api from '@/lib/api';

type ApiCourse = {
  _id: string;
  slug: string;
  title: string;
  shortDescription: string;
  thumbnail: string;
  instructorName: string;
  category?: { _id: string; name: string; slug: string } | null;
  difficulty: string;
  language: string;
  totalDuration: number;
  lessonCount: number;
  learnerCount: number;
  rating: number;
  reviewCount: number;
  price?: number;
  compareAtPrice?: number;
};

export default function CoursesPage() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get('category');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [difficulty, setDifficulty] = useState('all');

  const { data: cmsAll, isLoading: cmsLoading } = useQuery({
    queryKey: ['public-cms'],
    queryFn: async () => {
      const { data } = await api.get('/cms');
      return data.data || {};
    },
  });

  const pageCms = cmsAll?.coursesPage || {
    title: 'All',
    titleAccent: 'Courses',
    subtitle: 'Expert-led business courses. Learn marketing, sales, finance and more.',
  };

  const { data: categoriesData = [] } = useQuery({
    queryKey: ['public-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data || [];
    },
  });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['public-courses'],
    queryFn: async () => {
      const { data } = await api.get('/courses', { params: { limit: 50 } });
      return (data.data?.courses || []) as ApiCourse[];
    },
  });

  const categories = useMemo(() => {
    if (categoriesData.length) return ['All', ...categoriesData.map((c: any) => c.name)];
    const names = new Set<string>();
    courses.forEach((c) => c.category?.name && names.add(c.category.name));
    return ['All', ...Array.from(names)];
  }, [categoriesData, courses]);

  useEffect(() => {
    if (!categorySlug || !categoriesData.length) return;
    const match = categoriesData.find((c: any) => c.slug === categorySlug);
    if (match) setSelectedCategory(match.name);
  }, [categorySlug, categoriesData]);

  const filtered = courses.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.shortDescription.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'All' || c.category?.name === selectedCategory;
    const matchDifficulty = difficulty === 'all' || c.difficulty === difficulty;
    return matchSearch && matchCategory && matchDifficulty;
  });

  if (cmsLoading && isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[var(--bg-base)]">
        <div className="skeleton h-8 w-48 rounded" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg-base)]">
      <div className="border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-base)] py-10 sm:py-14">
        <div className="container">
          <div className="mb-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Link href="/" className="hover:text-[var(--text-secondary)]">Home</Link>
            <ChevronRight size={14} className="shrink-0" />
            <span className="text-[var(--brand-700)]">Courses</span>
          </div>
          <h1 className="mb-3 text-3xl font-extrabold sm:text-4xl">
            {pageCms.title}{' '}
            {pageCms.titleAccent ? <span className="gradient-text">{pageCms.titleAccent}</span> : null}
          </h1>
          {pageCms.subtitle ? (
            <p className="max-w-xl text-base text-[var(--text-secondary)] sm:text-lg">{pageCms.subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="container py-8 sm:py-10">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base w-full pl-10"
            />
          </div>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input-base sm:w-44">
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="input-base sm:w-40">
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-72 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-[var(--text-muted)]">No courses match your filters.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => {
              const price = course.price ?? 0;
              const discount = course.compareAtPrice ? calculateDiscount(course.compareAtPrice, price) : 0;
              return (
                <Link
                  key={course._id}
                  href={`/courses/${course.slug}`}
                  className="group overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] transition-colors hover:border-[var(--brand-500)]/40"
                >
                  <div className="relative aspect-video overflow-hidden bg-[var(--bg-elevated)]">
                    {course.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : null}
                    {course.category?.name ? (
                      <span className="absolute left-3 top-3 rounded-md bg-black/55 px-2 py-0.5 text-xs font-medium text-white">{course.category.name}</span>
                    ) : null}
                    {discount > 0 ? (
                      <span className="absolute right-3 top-3 rounded-md bg-[var(--brand-500)] px-2 py-0.5 text-xs font-bold text-[var(--navy-900)]">{discount}% OFF</span>
                    ) : null}
                  </div>
                  <div className="p-4 sm:p-5">
                    <h3 className="mb-2 line-clamp-2 font-bold text-[var(--text-primary)] group-hover:text-[var(--brand-700)]">{course.title}</h3>
                    <p className="mb-4 line-clamp-2 text-sm text-[var(--text-secondary)]">{course.shortDescription}</p>
                    <div className="mb-4 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
                      {course.totalDuration ? (
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatDuration(course.totalDuration)}</span>
                      ) : null}
                      {course.lessonCount ? (
                        <span className="inline-flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {course.lessonCount} lessons</span>
                      ) : null}
                      {course.learnerCount ? (
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.learnerCount.toLocaleString()}</span>
                      ) : null}
                      {course.rating ? (
                        <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-600" /> {course.rating.toFixed(1)}</span>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                      <span className="text-xs text-[var(--text-muted)]">{course.instructorName}</span>
                      <span className="font-bold text-[var(--text-primary)]">{price === 0 ? 'Free' : formatCurrency(price)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
