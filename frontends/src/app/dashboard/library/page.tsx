'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BookOpen, Clock, PlayCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

function formatDuration(totalMinutes: number) {
  if (!totalMinutes) return '—';
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export default function LibraryPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const { data: myCourses = [], isLoading } = useQuery({
    queryKey: ['library-courses'],
    queryFn: async () => {
      const { data } = await api.get('/progress/my-courses');
      return data.data || [];
    },
  });

  const courses = useMemo(
    () =>
      myCourses.map((item: any) => ({
        id: item.course?._id,
        title: item.course?.title,
        category: item.course?.category?.name || 'General',
        thumbnail: item.course?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
        instructor: item.course?.instructorName || '',
        duration: formatDuration(item.course?.totalDuration || 0),
        lessons: item.course?.lessonCount || 0,
        completed: item.completedLessons || 0,
        isCompleted: !!item.isCompleted,
      })),
    [myCourses]
  );

  const categories = useMemo<string[]>(() => {
    const unique = Array.from(new Set<string>(courses.map((c: any) => c.category)));
    return ['All', ...unique];
  }, [courses]);

  const filtered = courses.filter((c: any) => {
    const matchCategory = activeCategory === 'All' || c.category === activeCategory;
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="-mx-4 -mt-4 space-y-0 sm:-mx-5 sm:-mt-5 lg:-mx-8 lg:-mt-6">
      {/* Dark navy hero banner, matching brand course-library style */}
      <div className="surface-dark relative overflow-hidden px-4 py-8 sm:px-5 sm:py-10 lg:px-8">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--gradient-glow)' }} />
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl font-extrabold text-white sm:text-3xl">My Library</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-on-dark sm:text-base">
            All the courses you've purchased or been granted access to. Pick up right where you left off.
          </p>
        </div>
      </div>

      <div className="space-y-6 px-4 py-6 sm:px-5 sm:py-8 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Enrolled Courses</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search your library..."
              className="input-base w-full pl-9"
            />
          </div>
        </div>

        {categories.length > 1 && (
          <div className="toolbar-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors
                  ${activeCategory === cat ? 'border-[var(--brand-500)] bg-[var(--brand-500)] text-[var(--navy-900)] shadow-[0_8px_20px_-4px_rgba(193,146,42,0.35)]' : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-[300px] rounded-2xl" />)
          ) : filtered.length === 0 ? (
            <div className="col-span-full flex flex-col items-center py-16 text-center">
              <BookOpen className="mb-4 h-12 w-12 text-[var(--text-muted)]" />
              <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                {courses.length === 0 ? 'No courses yet' : 'No courses match your filters'}
              </h3>
              <p className="mb-6 text-sm text-[var(--text-secondary)]">
                {courses.length === 0 ? 'Purchase a plan to unlock courses in your library.' : 'Try a different search or category.'}
              </p>
              {courses.length === 0 && (
                <Link href="/packages" className="btn-brand">
                  View Plans
                </Link>
              )}
            </div>
          ) : (
            filtered.map((course: any) => {
              const progressPct = course.lessons > 0 ? Math.round((course.completed / course.lessons) * 100) : 0;
              return (
                <div key={course.id} className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
                  <div className="relative aspect-video">
                    <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-opacity group-hover:bg-black/20 group-hover:opacity-100">
                      <PlayCircle className="h-9 w-9 text-white drop-shadow" />
                    </div>
                    {course.isCompleted && (
                      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-[var(--success)]/90 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
                        <CheckCircle className="h-3.5 w-3.5" /> Completed
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--brand-700)]">{course.category}</div>
                    <h3 className="mb-1 line-clamp-2 font-bold text-[var(--text-primary)]">{course.title}</h3>
                    {course.instructor && <p className="mb-3 text-sm text-[var(--text-muted)]">{course.instructor}</p>}

                    <div className="mb-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {course.duration}</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {course.lessons} lessons</span>
                    </div>

                    <div className="mb-4">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${progressPct}%`, background: 'var(--gradient-brand)' }}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                        {course.completed} of {course.lessons} lessons completed
                      </p>
                    </div>

                    <div className="mt-auto">
                      <Link href={`/dashboard/courses/${course.id}`} className="btn-outline block w-full py-2 text-center text-sm">
                        {course.isCompleted ? 'Revisit Course' : progressPct > 0 ? 'Continue Course' : 'Access Course'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
