'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Search, Filter, BookOpen, CheckCircle } from 'lucide-react';
import Link from 'next/link';

type Tab = 'All' | 'In Progress' | 'Completed';

export default function MyCoursesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [q, setQ] = useState('');

  const { data: myCourses = [], isLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const { data } = await api.get('/progress/my-courses');
      return data.data || [];
    },
  });

  const mapped = myCourses.map((item: any) => ({
    id: item.course?._id,
    title: item.course?.title,
    thumbnail: item.course?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    progress: item.overallProgress || 0,
    completedLessons: item.completedLessons || 0,
    totalLessons: item.course?.lessonCount || 0,
    isCompleted: !!item.isCompleted,
    hasStarted: !!item.hasStarted,
    lastLessonId: item.lastLessonId,
  }));

  const filtered = mapped.filter((c: any) => {
    if (activeTab === 'Completed' && !c.isCompleted) return false;
    if (activeTab === 'In Progress' && (!c.hasStarted || c.isCompleted)) return false;
    if (q && !c.title?.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const tabs: Tab[] = ['All', 'In Progress', 'Completed'];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Courses</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            In-progress courses stay here; completed ones move to the Completed tab.
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses..."
            className="input-base pl-9 w-full"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 border-b border-[var(--border-subtle)]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-t-lg font-medium text-sm whitespace-nowrap transition-colors relative
              ${activeTab === tab ? 'text-[var(--brand-700)] bg-[var(--bg-surface)] border-t border-l border-r border-[var(--border-subtle)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-[280px] rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <BookOpen className="w-16 h-16 text-[var(--text-muted)] mb-4" />
          <h3 className="text-xl font-semibold mb-2">No courses here yet</h3>
          <p className="text-[var(--text-secondary)] mb-6">Upgrade a plan or explore the catalog to unlock courses.</p>
          <Link href="/packages" className="btn-brand">
            View Plans
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((course: any) => (
            <div key={course.id} className="glass-card-hover overflow-hidden flex flex-col group h-full">
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {course.isCompleted && (
                  <div className="absolute top-3 right-3 bg-green-500/20 text-green-600 border border-green-500/30 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 backdrop-blur-md">
                    <CheckCircle className="w-3 h-3" /> Completed
                  </div>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span>
                      {course.completedLessons}/{course.totalLessons || '—'} lessons
                    </span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--brand-500)] rounded-full" style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
                <Link
                  href={`/dashboard/courses/${course.id}${course.lastLessonId ? `?lesson=${course.lastLessonId}` : ''}`}
                  className="mt-auto pt-4 text-sm font-medium text-[var(--brand-700)] hover:underline"
                >
                  {course.isCompleted ? 'Revisit course' : course.progress > 0 ? 'Continue' : 'Start'} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
