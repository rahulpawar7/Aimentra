'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Lock, ChevronLeft, ChevronRight, Play, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import SecureVideoPlayer from '@/components/player/SecureVideoPlayer';
import toast from 'react-hot-toast';

export default function CoursePlayerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const lessonParam = searchParams.get('lesson');
  const courseId = params.courseId as string;
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stream, setStream] = useState<{
    manifestUrl?: string;
    progressiveUrl?: string;
    watermark?: { text: string };
  } | null>(null);

  const { data: courseData, isLoading } = useQuery({
    queryKey: ['course-player', courseId],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${courseId}/curriculum`);
      return data.data;
    },
  });

  const modules = courseData?.modules || [];

  const flatLessons = useMemo(() => {
    const list: any[] = [];
    for (const m of modules) {
      for (const l of m.lessons || []) list.push({ ...l, moduleTitle: m.title });
    }
    return list;
  }, [modules]);

  useEffect(() => {
    if (!flatLessons.length) return;
    if (lessonParam && flatLessons.some((l) => (l._id || l.id) === lessonParam)) {
      setActiveLessonId(lessonParam);
      return;
    }
    if (!activeLessonId) {
      const firstUnlocked = flatLessons.find((l) => !l.locked);
      const pick = firstUnlocked || flatLessons[0];
      setActiveLessonId(pick._id || pick.id);
    }
  }, [flatLessons, activeLessonId, lessonParam]);

  const activeLesson = flatLessons.find((l) => (l._id || l.id) === activeLessonId);
  const completedCount = flatLessons.filter((l) => l.completed).length;
  const progressPct = flatLessons.length ? Math.round((completedCount / flatLessons.length) * 100) : 0;

  useEffect(() => {
    if (!activeLessonId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.post(`/stream/token/${activeLessonId}`);
        if (!cancelled) setStream(data.data);
      } catch {
        if (!cancelled) setStream(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeLessonId]);

  const progressMutation = useMutation({
    mutationFn: async (payload: any) => api.post('/progress', payload),
  });

  const completeCourse = useMutation({
    mutationFn: async () => api.post(`/progress/course/${courseId}/complete`),
    onSuccess: () => {
      toast.success('Course marked complete — moved to Completed');
      qc.invalidateQueries({ queryKey: ['my-courses'] });
    },
  });

  const markLessonComplete = useMutation({
    mutationFn: async () =>
      api.post('/progress', {
        courseId,
        lessonId: activeLessonId,
        percentage: 100,
        completed: true,
        watchedSeconds: 0,
        totalSeconds: 0,
        lastPosition: 0,
      }),
    onSuccess: () => {
      toast.success('Lesson marked as complete');
      qc.invalidateQueries({ queryKey: ['course-player', courseId] });
    },
  });

  const watermark = stream?.watermark?.text || `${user?.email || 'learner'} · ${new Date().toLocaleString()}`;

  return (
    <div className="-mx-4 -mb-4 flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-[var(--bg-base)] sm:-mx-5 sm:-mb-5 lg:-mx-8 lg:-mb-8 md:flex-row">
      {!isSidebarOpen && (
        <button
          type="button"
          className="fixed bottom-6 left-6 z-50 rounded-full bg-[var(--brand-500)] p-3 text-[var(--navy-900)] shadow-lg md:hidden"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Play className="h-5 w-5" />
        </button>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(320px,85vw)] flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] transition-transform duration-300 md:static md:w-80 md:shrink-0 md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
        }`}
      >
        <div className="p-4 border-b border-[var(--border-subtle)] flex justify-between items-center">
          <Link href="/dashboard/courses" className="text-sm text-[var(--text-muted)] flex items-center gap-1 hover:text-[var(--text-primary)]">
            <ChevronLeft className="w-4 h-4" /> My Courses
          </Link>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {flatLessons.length > 0 && (
          <div className="border-b border-[var(--border-subtle)] px-4 py-3">
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
              <span>{completedCount} of {flatLessons.length} lessons completed</span>
              <span className="font-semibold text-[var(--brand-700)]">{progressPct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
              <div className="h-full rounded-full" style={{ width: `${progressPct}%`, background: 'var(--gradient-brand)' }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-10 rounded" />)}</div>
          ) : (
            modules.map((module: any, mIdx: number) => (
              <div key={module._id || module.id || mIdx}>
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-2">
                  {module.title}
                </h3>
                {(module.lessons || []).map((lesson: any) => {
                  const id = lesson._id || lesson.id;
                  const locked = lesson.locked;
                  const active = id === activeLessonId;
                  return (
                    <button
                      key={id}
                      disabled={locked}
                      onClick={() => setActiveLessonId(id)}
                      className={`w-full text-left p-3 rounded-lg flex items-start gap-3 text-sm mb-1 ${
                        active ? 'bg-[var(--brand-500)]/10 border border-[var(--brand-500)]/30' : 'hover:bg-[var(--bg-card-hover)]'
                      } ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {lesson.completed ? (
                        <CheckCircle className="w-4 h-4 text-[var(--success)] mt-0.5 shrink-0" />
                      ) : locked ? (
                        <Lock className="w-4 h-4 mt-0.5 shrink-0 text-[var(--text-muted)]" />
                      ) : (
                        <Play className="w-4 h-4 mt-0.5 shrink-0 text-[var(--brand-600)]" />
                      )}
                      <span className="line-clamp-2 text-[var(--text-primary)]">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="p-3 border-t border-[var(--border-subtle)]">
          <button
            className="btn-outline w-full py-2 text-sm"
            onClick={() => completeCourse.mutate()}
            disabled={completeCourse.isPending}
          >
            Mark Course Complete
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="space-y-4 p-4 md:p-6">
          {courseData?.title && (
            <nav className="flex flex-wrap items-center gap-1 text-xs text-[var(--text-muted)] sm:text-sm">
              <Link href="/dashboard/courses" className="hover:text-[var(--text-primary)]">My Courses</Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              <span className="max-w-[40vw] truncate text-[var(--text-secondary)] sm:max-w-none">{courseData.title}</span>
              {activeLesson?.moduleTitle && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  <span className="max-w-[30vw] truncate text-[var(--text-secondary)] sm:max-w-none">{activeLesson.moduleTitle}</span>
                </>
              )}
            </nav>
          )}

          <div className="flex items-start justify-end gap-3">
            <button
              type="button"
              className="hidden shrink-0 rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-secondary)] md:inline-flex"
              onClick={() => setIsSidebarOpen((v) => !v)}
            >
              Curriculum
            </button>
          </div>
          {activeLesson && (stream?.manifestUrl || stream?.progressiveUrl || activeLesson.videoUrl) ? (
            <SecureVideoPlayer
              manifestUrl={stream?.manifestUrl}
              progressiveUrl={stream?.progressiveUrl || activeLesson.videoUrl}
              watermarkText={watermark}
              poster={activeLesson.videoPoster || activeLesson.videoThumbnail}
              onProgress={({ currentTime, duration, percentage }) => {
                if (percentage % 10 === 0) {
                  progressMutation.mutate({
                    courseId,
                    lessonId: activeLessonId,
                    watchedSeconds: Math.floor(currentTime),
                    totalSeconds: Math.floor(duration),
                    lastPosition: Math.floor(currentTime),
                    percentage,
                    completed: percentage >= 90,
                  });
                }
              }}
              onEnded={() => {
                progressMutation.mutate({
                  courseId,
                  lessonId: activeLessonId,
                  percentage: 100,
                  completed: true,
                  watchedSeconds: 0,
                  totalSeconds: 0,
                  lastPosition: 0,
                });
              }}
            />
          ) : flatLessons.length === 0 ? (
            <div className="aspect-video bg-[var(--bg-surface)] rounded-xl flex flex-col items-center justify-center gap-3 text-center p-6 text-[var(--text-muted)]">
              <p className="font-medium text-[var(--text-secondary)]">No lessons available yet</p>
              <p className="text-sm">This course curriculum is being prepared. Please check back soon.</p>
              <Link href="/dashboard/courses" className="btn-outline text-sm mt-2">Back to My Courses</Link>
            </div>
          ) : (
            <div className="aspect-video bg-[var(--bg-surface)] rounded-xl flex items-center justify-center text-[var(--text-muted)]">
              {activeLesson?.content ? (
                <div className="prose max-w-3xl p-6" dangerouslySetInnerHTML={{ __html: activeLesson.content }} />
              ) : (
                'Select a lesson from the curriculum to begin'
              )}
            </div>
          )}

          {activeLesson && (
            <>
              <button
                type="button"
                onClick={() => markLessonComplete.mutate()}
                disabled={markLessonComplete.isPending || activeLesson.completed}
                className="btn-outline w-full gap-2 sm:w-auto"
              >
                <CheckCircle2 className="h-4 w-4" />
                {activeLesson.completed ? 'Lesson Completed' : 'Mark As Complete'}
              </button>

              <div className="border-t border-[var(--border-subtle)] pt-4">
                <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
                  {activeLesson.title}
                </h1>
                {activeLesson.moduleTitle && (
                  <p className="mt-1 text-sm font-medium text-[var(--brand-700)]">{activeLesson.moduleTitle}</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
