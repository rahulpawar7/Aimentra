'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Play, Clock, BookOpen, Users, Star, Check, Lock, Shield, Award,
  Globe, ChevronDown, ChevronRight, Zap, ChevronUp, CheckCircle2,
} from 'lucide-react';
import { formatDuration, formatCurrency } from '@/lib/utils';
import { useAuthSession } from '@/hooks/useAuthSession';
import { buildCheckoutUrl, buildLoginUrl } from '@/lib/auth-utils';
import api from '@/lib/api';

const genericFaqs = [
  { question: 'Do I need prior experience?', answer: 'No! This course starts from the basics and builds up to advanced strategies. Perfect for complete beginners.' },
  { question: 'Will I get a certificate?', answer: "Yes! Upon completing the course, you'll receive a verified digital certificate you can share on LinkedIn." },
  { question: "What if I'm not satisfied?", answer: 'We offer a 7-day money-back guarantee. Contact support within 7 days of purchase for a full refund.' },
];

export default function CourseLandingPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { isAuthenticated, authReady } = useAuthSession();
  const [openModule, setOpenModule] = useState<number | null>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const { data: courseRes, isLoading: courseLoading } = useQuery({
    queryKey: ['course-landing', slug],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${slug}`);
      return data.data as { course: any; isEnrolled: boolean };
    },
    enabled: !!slug,
  });

  const { data: curriculumRes } = useQuery({
    queryKey: ['course-landing-curriculum', slug],
    queryFn: async () => {
      const { data } = await api.get(`/courses/${slug}/curriculum`);
      return data.data as { modules: any[] };
    },
    enabled: !!slug,
  });

  const { data: plans } = useQuery({
    queryKey: ['plans-for-course'],
    queryFn: async () => {
      const { data } = await api.get('/plans');
      return (data.data?.plans || data.data || []) as any[];
    },
  });

  const course = courseRes?.course;
  const isEnrolled = courseRes?.isEnrolled;
  const modules = curriculumRes?.modules || [];

  const { data: enrolledProgress } = useQuery({
    queryKey: ['my-course-progress', course?._id],
    queryFn: async () => {
      const { data } = await api.get('/progress/my-courses');
      return (data.data || []).find((item: any) => item.course?._id === course?._id) as
        | { lastLessonId?: string }
        | undefined;
    },
    enabled: !!isEnrolled && !!course?._id,
  });

  // Pick the cheapest active plan that actually unlocks THIS course —
  // never fall back to a plan that grants no course access (e.g. Free).
  const bestPlan = useMemo(() => {
    if (!plans || !course) return null;
    const eligible = plans.filter(
      (p: any) => p.allCourses || (p.courses || []).map(String).includes(String(course._id))
    );
    if (eligible.length === 0) return null;
    return eligible.sort((a: any, b: any) => a.price - b.price)[0];
  }, [plans, course]);

  const handleEnroll = () => {
    if (isEnrolled) {
      const lesson = enrolledProgress?.lastLessonId;
      router.push(`/dashboard/courses/${course._id}${lesson ? `?lesson=${lesson}` : ''}`);
      return;
    }
    if (!bestPlan) {
      router.push('/packages');
      return;
    }
    if (!authReady) return;

    const checkoutUrl = buildCheckoutUrl({ planId: bestPlan._id });
    if (isAuthenticated) {
      router.push(checkoutUrl);
    } else {
      router.push(buildLoginUrl(checkoutUrl));
    }
  };

  if (courseLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton h-6 w-48 rounded" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container py-20 text-center">
        <h1 className="mb-3 text-2xl font-bold text-[var(--text-primary)]">Course not found</h1>
        <p className="mb-6 text-[var(--text-secondary)]">This course may have been removed or the link is incorrect.</p>
        <Link href="/courses" className="btn-brand inline-flex px-6 py-3">Browse all courses</Link>
      </div>
    );
  }

  const faqs: Array<{ question: string; answer: string }> = course.faqs?.length ? course.faqs : genericFaqs;
  const whatYouLearn: string[] = course.whatYouLearn?.length
    ? course.whatYouLearn
    : ['Practical, real-world skills you can apply immediately', 'Frameworks used by top Indian businesses', 'Lifetime-relevant strategies, not just theory'];
  const price = bestPlan?.price ?? course.price ?? 0;
  const compareAtPrice = bestPlan?.compareAtPrice ?? course.compareAtPrice;
  const discount = compareAtPrice && compareAtPrice > price ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Hero */}
      <div className="border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-base)] py-8 sm:py-12">
        <div className="container">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
            {/* Left: course info */}
            <div className="min-w-0 flex-1">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Link href="/courses" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem' }}>Courses</Link>
                <ChevronRight size={14} color="var(--text-muted)" />
                <span style={{ color: 'var(--brand-700)', fontSize: '0.875rem' }}>{course.category?.name || 'Business'}</span>
              </div>

              <h1 style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: '800', marginBottom: '16px', lineHeight: 1.2 }}>
                {course.title}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '24px', lineHeight: 1.6 }}>
                {course.shortDescription}
              </p>

              {/* Rating + learners */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={16} fill={s <= Math.round(course.rating || 4.8) ? '#f59e0b' : 'none'} color="#f59e0b" />)}
                  <span style={{ color: '#f59e0b', fontWeight: '700' }}>{course.rating || 4.8}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>({(course.reviewCount || 0).toLocaleString()} reviews)</span>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <Users size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  {(course.learnerCount || 0).toLocaleString()} students
                </span>
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {[
                  { icon: <Clock size={16} />, label: formatDuration(course.totalDuration || 0) },
                  { icon: <BookOpen size={16} />, label: `${course.lessonCount || modules.reduce((n: number, m: any) => n + (m.lessons?.length || 0), 0)} lessons` },
                  { icon: <Globe size={16} />, label: course.language || 'English' },
                  { icon: <Award size={16} />, label: 'Certificate' },
                ].map(({ icon, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {icon} {label}
                  </div>
                ))}
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                By <strong style={{ color: 'var(--brand-700)' }}>{course.instructorName}</strong>
              </p>
            </div>

            {/* Right: pricing card (sticky) */}
            <div className="w-full min-w-0 shrink-0 lg:w-[340px]">
              <div className="glass-card sticky top-[90px] p-5 sm:p-7">
                {/* Thumbnail preview */}
                <div style={{ aspectRatio: '16/9', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '20px', position: 'relative' }}>
                  <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.4)',
                  }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Play size={24} color="var(--brand-600)" fill="var(--brand-600)" />
                    </div>
                  </div>
                </div>

                <div className="mb-2 flex flex-wrap items-baseline gap-2 sm:gap-3">
                  <span className="text-2xl font-extrabold sm:text-[2rem]">{formatCurrency(price)}</span>
                  {discount > 0 && (
                    <>
                      <span className="text-base text-[var(--text-muted)] line-through sm:text-lg">
                        {formatCurrency(compareAtPrice)}
                      </span>
                      <span className="rounded-full bg-[var(--success-bg)] px-2.5 py-0.5 text-sm font-bold text-[var(--success)]">
                        {discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                {bestPlan && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
                    Unlocked with the <strong style={{ color: 'var(--brand-700)' }}>{bestPlan.name}</strong> plan
                  </p>
                )}

                <button onClick={handleEnroll} className="btn-brand" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginBottom: '12px' }}>
                  {isEnrolled ? 'Continue Learning' : bestPlan ? `Enroll Now — ${formatCurrency(price)}` : 'View Plans'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '20px' }}>
                  <Shield size={14} /> 7-Day Money-Back Guarantee
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(bestPlan?.highlights?.length ? bestPlan.highlights : ['Full course access', 'Completion certificate', 'Community access']).map((f: string) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      <Check size={14} color="var(--success)" /> {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8 sm:py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
          <div className="min-w-0 flex-1">
            <section className="mb-10 sm:mb-12">
              <h2 className="mb-5 text-xl font-extrabold sm:mb-6 sm:text-2xl">What You&apos;ll Learn</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {whatYouLearn.map((item: string) => (
                  <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <Check size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Curriculum */}
            {modules.length > 0 && (
              <section style={{ marginBottom: '48px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>Course Curriculum</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.875rem' }}>
                  {modules.length} modules • {modules.reduce((n: number, m: any) => n + (m.lessons?.length || 0), 0)} lessons • {formatDuration(course.totalDuration || 0)} total
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {modules.map((module: any, idx: number) => (
                    <div key={module._id || idx} className="glass-card" style={{ overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setOpenModule(openModule === idx ? null : idx)}
                        className="flex w-full items-start justify-between gap-3 bg-transparent p-4 text-[var(--text-primary)] sm:items-center sm:px-5"
                      >
                        <div className="flex min-w-0 items-start gap-3 sm:items-center">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--gradient-brand)] text-xs font-bold text-white">
                            {idx + 1}
                          </div>
                          <span className="min-w-0 text-left text-sm font-semibold sm:text-[0.95rem]">{module.title}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                          <span className="hidden text-xs text-[var(--text-muted)] xs:inline sm:text-sm">
                            {module.lessons?.length || 0} lessons
                          </span>
                          {openModule === idx ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                        </div>
                      </button>
                      {openModule === idx && (
                        <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                          {(module.lessons || []).map((lesson: any, li: number) => (
                            <div key={lesson._id || li} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: li < module.lessons.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                              {lesson.isFree || lesson.isPreview ? <Play size={14} color="var(--brand-600)" /> : <Lock size={14} color="var(--text-muted)" />}
                              <span style={{ color: lesson.isFree || lesson.isPreview ? 'var(--text-secondary)' : 'var(--text-muted)', fontSize: '0.875rem', flex: 1 }}>{lesson.title}</span>
                              {(lesson.isFree || lesson.isPreview) && <span style={{ fontSize: '0.7rem', color: 'var(--success)', fontWeight: '600', background: 'var(--success-bg)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>FREE</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Instructor */}
            <section style={{ marginBottom: '48px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>Your Instructor</h2>
              <div className="glass-card p-5 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--gradient-brand)] text-2xl font-extrabold text-white sm:h-[72px] sm:w-[72px]">
                    {course.instructorName?.slice(0, 1) || 'I'}
                  </div>
                  <div className="min-w-0">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>{course.instructorName}</h3>
                    <p style={{ color: 'var(--brand-700)', fontSize: '0.875rem', marginBottom: '12px' }}>Business Coach & Entrepreneur</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {course.instructorBio || 'An experienced instructor dedicated to helping students achieve real, measurable results.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section style={{ marginBottom: '48px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px' }}>Frequently Asked Questions</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {faqs.map((faq, idx: number) => (
                  <div key={idx} className="glass-card" style={{ overflow: 'hidden' }}>
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
                    >
                      <span style={{ fontWeight: '600', fontSize: '0.95rem', textAlign: 'left' }}>{faq.question}</span>
                      {openFaq === idx ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                    </button>
                    {openFaq === idx && (
                      <div style={{ padding: '0 20px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, paddingTop: '12px' }}>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="px-1 py-10 text-center sm:py-14">
          <h2 className="mb-4 text-2xl font-extrabold sm:text-3xl">
            Ready to <span className="gradient-text">Transform Your Business</span>?
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-[var(--text-secondary)]">
            Join {(course.learnerCount || 0).toLocaleString()}+ students who have already transformed their business with this course.
          </p>
          <button type="button" onClick={handleEnroll} className="btn-brand px-6 py-3 text-base sm:px-10 sm:py-4 sm:text-lg">
            {isEnrolled ? <><CheckCircle2 size={20} /> Continue Learning</> : <><Zap size={20} /> Enroll Now — {formatCurrency(price)}</>}
          </button>
          <p className="mt-3 text-sm text-[var(--text-muted)]">7-day money-back guarantee • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}
