'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { BookOpen, Clock, Award, Flame, PlayCircle, Calendar, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { getProgressSummary, getContinueLearning, getMyCourses, getMyEntitlements, getEvents, getRecentActivity } from '@/lib/services';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: summary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: getProgressSummary,
  });

  const { data: continueLearning } = useQuery({
    queryKey: ['continue-learning'],
    queryFn: getContinueLearning,
  });

  const { data: myCourses } = useQuery({
    queryKey: ['my-courses-dashboard'],
    queryFn: getMyCourses,
  });

  const { data: entitlements } = useQuery({
    queryKey: ['my-entitlements'],
    queryFn: getMyEntitlements,
  });

  const { data: eventsData } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: () => getEvents({ upcoming: true }),
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: getRecentActivity,
  });

  const activeEntitlement = entitlements?.[0];
  const daysUntilExpiry = activeEntitlement?.expiryDate
    ? Math.ceil((new Date(activeEntitlement.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const accessExpiring = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30 && !activeEntitlement?.lifetime;

  const recentCourses = (continueLearning ?? []).slice(0, 2);
  const activeCourses = (myCourses ?? []).filter((c: any) => !c.isCompleted && c.hasStarted).slice(0, 3);
  const upcomingEvents = eventsData?.events ?? [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (isSummaryLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-up space-y-6 sm:space-y-8">
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)] sm:text-base">Let&apos;s continue your learning journey.</p>
        </div>
        {accessExpiring && (
          <div className="flex w-full items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-amber-600 sm:w-auto">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Access Expiring:</span> {daysUntilExpiry} days left.
              <Link href="/dashboard/access" className="ml-1 font-medium underline">Renew now</Link>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { icon: BookOpen, label: 'Courses', value: summary?.coursesEnrolled ?? 0, color: 'text-blue-600', bg: 'bg-blue-400/10' },
          { icon: Clock, label: 'Hours', value: summary?.hoursWatched ?? 0, color: 'text-[var(--brand-700)]', bg: 'bg-[var(--brand-500)]/10' },
          { icon: Award, label: 'Completed', value: summary?.completedCount ?? 0, color: 'text-green-600', bg: 'bg-green-400/10' },
          { icon: Flame, label: 'In Progress', value: summary?.inProgressCount ?? 0, color: 'text-orange-400', bg: 'bg-orange-400/10' },
        ].map((stat, idx) => (
          <div key={idx} className="glass-card flex min-w-0 items-center gap-3 p-3 sm:gap-4 sm:p-5">
            <div className={`shrink-0 rounded-xl p-2 sm:p-3 ${stat.bg} ${stat.color}`}>
              <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-medium text-[var(--text-muted)] sm:text-sm">{stat.label}</p>
              <h3 className="truncate text-lg font-bold text-[var(--text-primary)] sm:text-2xl">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
              <PlayCircle className="w-5 h-5 text-[var(--brand-700)]" /> Continue Learning
            </h2>
            {recentCourses.length === 0 ? (
              <div className="glass-card p-8 text-center text-[var(--text-secondary)]">
                <p>No courses in progress. <Link href="/courses" className="text-[var(--brand-700)] underline">Browse courses</Link></p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentCourses.map((item: any) => (
                  <Link key={item.course?._id} href={`/dashboard/courses/${item.course?._id}${item.lastLessonId ? `?lesson=${item.lastLessonId}` : ''}`} className="glass-card-hover flex gap-3 p-3 sm:gap-4 sm:p-4 group">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg sm:h-24 sm:w-24">
                      <img src={item.course?.thumbnail || '/placeholder-course.jpg'} alt={item.course?.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-[var(--text-primary)] truncate">{item.course?.title}</h3>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{item.completedLessons} lessons completed</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1.5 font-medium">
                          <span className="text-[var(--text-secondary)]">Progress</span>
                          <span className="text-[var(--brand-700)]">{item.overallProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-brand rounded-full" style={{ width: `${item.overallProgress}%` }} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">My Active Courses</h2>
              <Link href="/dashboard/courses" className="text-sm font-medium text-[var(--brand-700)]">View All</Link>
            </div>
            {activeCourses.length === 0 ? (
              <div className="glass-card p-8 text-center text-[var(--text-secondary)]">
                <p>No enrolled courses yet. <Link href="/packages" className="text-[var(--brand-700)] underline">Get a plan</Link></p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeCourses.map((item: any) => (
                  <div key={item.course?._id} className="card p-0 overflow-hidden group">
                    <div className="p-5">
                      <h3 className="font-semibold text-lg text-[var(--text-primary)] line-clamp-1">{item.course?.title}</h3>
                      <p className="text-sm text-[var(--text-muted)] mt-1">By {item.course?.instructorName || 'Aimentra'}</p>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">{item.completedLessons} / {item.course?.lessonCount || '?'} Lessons</span>
                        <span className="font-semibold">{item.overallProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-[var(--brand-500)] rounded-full" style={{ width: `${item.overallProgress}%` }} />
                      </div>
                    </div>
                    <div className="px-5 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                      <Link href={`/dashboard/courses/${item.course?._id}${item.lastLessonId ? `?lesson=${item.lastLessonId}` : ''}`} className="text-sm font-medium hover:text-[var(--brand-700)]">
                        {item.overallProgress > 0 ? 'Continue Course' : 'Start Course'} &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-[var(--brand-700)]" /> Recent Activity
            </h3>
            {activity.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No activity yet. Start a course to see your progress here.</p>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 8).map((item: any) => (
                  <Link
                    key={item.id}
                    href={item.href || '#'}
                    className="block rounded-lg border border-transparent p-3 hover:border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{item.description}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">{formatDate(item.timestamp)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-6 border-t-4 border-t-[var(--brand-500)]">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-[var(--brand-700)]" /> Upcoming Events
            </h3>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No upcoming events scheduled.</p>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.slice(0, 3).map((event: any) => (
                  <div key={event._id} className="flex gap-4 items-start p-3 rounded-lg hover:bg-[var(--bg-surface)] border border-transparent hover:border-[var(--border-subtle)]">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex flex-col items-center justify-center shrink-0 border border-[var(--border-subtle)]">
                      <span className="text-[10px] uppercase font-bold text-[var(--brand-700)]">
                        {new Date(event.date).toLocaleString('en', { month: 'short' })}
                      </span>
                      <span className="text-sm font-bold">{new Date(event.date).getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-[var(--text-primary)]">{event.title}</h4>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        {new Date(event.date).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/events" className="block w-full mt-4 btn-outline py-2 text-sm text-center">View Calendar</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
