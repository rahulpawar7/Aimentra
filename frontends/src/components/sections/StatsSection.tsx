'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Users, BookOpen, Target, Award } from 'lucide-react';

type StatItem = { label: string; value: string; suffix?: string; raw?: number };

interface StatItemProps {
  icon: React.ReactNode;
  displayValue: string;
  suffix?: string;
  label: string;
  animate?: boolean;
  raw?: number;
}

function AnimatedStat({ icon, displayValue, suffix = '', label, animate = true, raw = 0 }: StatItemProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const isDecimal = displayValue.includes('.');
  const target = raw || Number.parseFloat(displayValue.replace(/,/g, '')) || 0;

  useEffect(() => {
    if (!isVisible || !animate) return;
    let start = 0;
    const duration = 1400;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target, animate]);

  const display = animate
    ? isDecimal
      ? count.toFixed(1)
      : Math.floor(count).toLocaleString('en-IN')
    : displayValue;

  return (
    <div ref={ref} className="flex min-w-0 flex-col items-center justify-center px-2 py-5 text-center sm:px-4 sm:py-6">
      <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-500)]/10 text-[var(--brand-600)] sm:h-11 sm:w-11">
        {icon}
      </div>
      <p className="mb-1.5 text-2xl font-extrabold tabular-nums leading-none tracking-tight text-[var(--text-primary)] sm:text-3xl md:text-4xl">
        {display}{suffix}
      </p>
      <p className="text-xs font-medium leading-snug text-[var(--text-secondary)] sm:text-sm">{label}</p>
    </div>
  );
}

export default function StatsSection({ statItems = [] }: { statItems?: StatItem[] }) {
  if (statItems.length === 0) return null;

  const icons = [
    <Users className="h-5 w-5 sm:h-6 sm:w-6" key="u" />,
    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6" key="b" />,
    <Target className="h-5 w-5 sm:h-6 sm:w-6" key="t" />,
    <Award className="h-5 w-5 sm:h-6 sm:w-6" key="a" />,
  ];

  return (
    <section className="bg-[var(--bg-base)] px-4 py-10 sm:py-14 md:py-20 md:px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3 shadow-[var(--shadow-card)] sm:rounded-3xl sm:p-5 md:p-6">
          <div className="relative z-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-[var(--border-subtle)] lg:grid-cols-4">
            {statItems.map((item, i) => (
              <div key={`${item.label}-${i}`} className="bg-[var(--bg-card)]">
                <AnimatedStat
                  icon={icons[i % icons.length]}
                  displayValue={item.value}
                  suffix={item.suffix || ''}
                  label={item.label}
                  raw={item.raw}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
