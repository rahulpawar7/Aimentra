'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutTemplate, BookOpen, Newspaper, Calendar, MessageSquareQuote,
  Tag, CreditCard, Users, ShoppingBag, ArrowRight, Globe, Layers,
} from 'lucide-react';
import { getAdminDashboard } from '@/lib/services';
import api from '@/lib/api';

const CMS_MODULES = [
  { icon: LayoutTemplate, label: 'Website Content', desc: 'Hero, stats, FAQ, footer, legal pages', href: '/admin/cms', color: 'text-[var(--brand-700)]', bg: 'bg-[var(--brand-500)]/10' },
  { icon: BookOpen, label: 'Courses', desc: 'Create, edit, publish courses & curriculum', href: '/admin/courses', color: 'text-blue-600', bg: 'bg-blue-500/10' },
  { icon: Tag, label: 'Categories', desc: 'Manage course categories', href: '/admin/categories', color: 'text-purple-600', bg: 'bg-purple-500/10' },
  { icon: Newspaper, label: 'Blog Posts', desc: 'Publish articles & resources', href: '/admin/blog', color: 'text-orange-600', bg: 'bg-orange-500/10' },
  { icon: Calendar, label: 'Events', desc: 'Live workshops & meetups', href: '/admin/events', color: 'text-pink-600', bg: 'bg-pink-500/10' },
  { icon: MessageSquareQuote, label: 'Testimonials', desc: 'Student reviews on homepage', href: '/admin/testimonials', color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
  { icon: CreditCard, label: 'Plans & Pricing', desc: 'Subscription tiers & features', href: '/admin/plans', color: 'text-green-600', bg: 'bg-green-500/10' },
  { icon: Users, label: 'Users', desc: 'Manage accounts & access', href: '/admin/users', color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
  { icon: ShoppingBag, label: 'Orders', desc: 'Transactions & refunds', href: '/admin/orders', color: 'text-red-600', bg: 'bg-red-500/10' },
];

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({ queryKey: ['admin-dashboard'], queryFn: getAdminDashboard });

  const { data: contentCounts } = useQuery({
    queryKey: ['admin-content-counts'],
    queryFn: async () => {
      const [courses, blog, events, testimonials, categories] = await Promise.all([
        api.get('/admin/courses').then(r => r.data.data?.courses?.length ?? 0).catch(() => 0),
        api.get('/blog', { params: { all: 'true', limit: 1 } }).then(r => r.data.data?.total ?? 0).catch(() => 0),
        api.get('/events').then(r => r.data.data?.total ?? r.data.data?.events?.length ?? 0).catch(() => 0),
        api.get('/testimonials', { params: { all: 'true' } }).then(r => r.data.data?.length ?? 0).catch(() => 0),
        api.get('/categories').then(r => r.data.data?.length ?? 0).catch(() => 0),
      ]);
      return { courses, blog, events, testimonials, categories };
    },
  });

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Globe className="w-6 h-6 text-[var(--brand-700)]" /> CMS Control Center
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage all end-user-facing content from here. Changes go live instantly.</p>
        </div>
        <Link href="/" target="_blank" className="btn-outline flex items-center gap-2 text-sm self-start">
          <Globe className="w-4 h-4" /> Preview Live Site
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Courses', value: contentCounts?.courses ?? stats?.publishedCourses ?? 0 },
          { label: 'Blog Posts', value: contentCounts?.blog ?? 0 },
          { label: 'Events', value: contentCounts?.events ?? 0 },
          { label: 'Testimonials', value: contentCounts?.testimonials ?? 0 },
          { label: 'Categories', value: contentCounts?.categories ?? 0 },
          { label: 'Users', value: stats?.totalUsers ?? 0 },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* CMS Modules grid */}
      <div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[var(--brand-700)]" /> Content Management
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CMS_MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href} className="glass-card p-5 flex items-start gap-4 group hover:border-[var(--brand-500)]/30 transition-all">
              <div className={`p-3 rounded-xl ${mod.bg} ${mod.color} group-hover:scale-110 transition-transform shrink-0`}>
                <mod.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--brand-700)]">{mod.label}</h3>
                  <ArrowRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </div>
                <p className="text-sm text-[var(--text-muted)] mt-1">{mod.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {(stats?.recentOrders?.length > 0 || stats?.recentUsers?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stats.recentOrders?.length > 0 && (
            <div className="glass-card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">Recent Orders</h3>
                <Link href="/admin/orders" className="text-sm text-[var(--brand-700)]">View all</Link>
              </div>
              <div className="space-y-3">
                {stats.recentOrders.slice(0, 5).map((o: any) => (
                  <div key={o._id} className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">{o.userId?.name || 'User'}</span>
                    <span className={`badge text-xs ${o.status === 'paid' ? 'badge-success' : 'badge-warning'}`}>{o.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {stats.recentUsers?.length > 0 && (
            <div className="glass-card p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold">New Users</h3>
                <Link href="/admin/users" className="text-sm text-[var(--brand-700)]">View all</Link>
              </div>
              <div className="space-y-3">
                {stats.recentUsers.slice(0, 5).map((u: any) => (
                  <div key={u._id} className="flex justify-between text-sm">
                    <span className="text-[var(--text-primary)] font-medium">{u.name}</span>
                    <span className="text-[var(--text-muted)]">{u.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
