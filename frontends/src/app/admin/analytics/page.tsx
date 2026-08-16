'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, CreditCard, BookOpen } from 'lucide-react';
import { getAdminAnalytics } from '@/lib/services';
import { formatCurrency } from '@/lib/utils';

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: getAdminAnalytics,
  });

  if (isLoading) return <div className="p-8 text-center"><div className="skeleton h-8 w-48 mx-auto" /></div>;

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-[var(--text-secondary)] mt-1">Platform performance and growth metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: data?.totalUsers ?? 0, icon: Users, color: 'text-blue-500' },
          { label: 'Active Subscriptions', value: data?.activeSubscriptions ?? 0, icon: TrendingUp, color: 'text-green-500' },
          { label: 'Monthly Revenue', value: formatCurrency(data?.revenueThisMonth ?? 0), icon: CreditCard, color: 'text-[var(--brand-700)]' },
          { label: 'New Signups (Month)', value: data?.newSignups ?? 0, icon: BookOpen, color: 'text-pink-500' },
        ].map((m, i) => (
          <div key={i} className="glass-card p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-[var(--bg-surface)] ${m.color}`}><m.icon className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">{m.label}</p>
              <p className="text-2xl font-bold">{m.value}</p>
            </div>
          </div>
        ))}
      </div>

      {data?.topCourses?.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold mb-4">Top Courses by Learners</h2>
          <div className="space-y-3">
            {data.topCourses.map((c: any, i: number) => (
              <div key={c._id || i} className="flex justify-between items-center p-3 rounded-lg bg-[var(--bg-surface)]">
                <span className="font-medium">{c.title}</span>
                <span className="text-[var(--text-muted)]">{(c.learnerCount ?? 0).toLocaleString()} learners</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
