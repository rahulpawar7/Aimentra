'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Play, Edit, Trash } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

type AdminCourse = {
  _id: string;
  title: string;
  category?: { name: string } | null;
  lessonCount: number;
  learnerCount: number;
  status: string;
  thumbnail?: string;
};

export default function AdminCoursesPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', activeTab, search],
    queryFn: async () => {
      const { data } = await api.get('/admin/courses', {
        params: { status: activeTab === 'All' ? undefined : activeTab.toLowerCase(), search: search || undefined },
      });
      return data.data?.courses as AdminCourse[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/courses/${id}`),
    onSuccess: () => {
      toast.success('Course deleted');
      qc.invalidateQueries({ queryKey: ['admin-courses'] });
    },
    onError: () => toast.error('Failed to delete course'),
  });

  const courses = data || [];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Course Management</h1>
          <p className="text-[var(--text-secondary)] mt-1">Create, edit, and manage your course catalog.</p>
        </div>
        <Link href="/admin/courses/new" className="btn-brand flex items-center gap-2 shadow-lg [box-shadow:0_8px_20px_-4px_rgba(193,146,42,0.35)]">
          <Plus className="w-4 h-4" /> New Course
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 gap-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {['All', 'Published', 'Draft', 'Archived'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                    ${activeTab === tab ? 'bg-[var(--brand-500)]/10 text-[var(--brand-700)] border border-[var(--brand-500)]/20' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'}
                  `}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search courses..."
                  className="input-base pl-9 h-9 text-sm w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="table-scroll">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--bg-surface)] text-[var(--text-muted)] border-b border-[var(--border-subtle)] uppercase text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Course Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-center">Lessons</th>
                <th className="px-6 py-4 text-center">Students</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="flex items-center gap-4"><div className="skeleton w-16 h-10 rounded"></div><div className="space-y-2"><div className="skeleton h-4 w-40"></div><div className="skeleton h-3 w-20"></div></div></div></td>
                    <td className="px-6 py-4"><div className="skeleton h-4 w-20"></div></td>
                    <td className="px-6 py-4"><div className="skeleton h-4 w-8 mx-auto"></div></td>
                    <td className="px-6 py-4"><div className="skeleton h-4 w-12 mx-auto"></div></td>
                    <td className="px-6 py-4"><div className="skeleton h-6 w-20 rounded-full"></div></td>
                    <td className="px-6 py-4"><div className="skeleton h-8 w-8 rounded ml-auto"></div></td>
                  </tr>
                ))
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    No courses found. Click &quot;New Course&quot; to create one.
                  </td>
                </tr>
              ) : courses.map((course) => (
                <tr key={course._id} className="hover:bg-[var(--bg-surface)] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-10 bg-[var(--bg-elevated)] rounded-md border border-[var(--border-subtle)] flex items-center justify-center shrink-0 overflow-hidden">
                        {course.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Play className="w-5 h-5 text-[var(--text-muted)]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/courses/${course._id}`} className="font-bold text-[var(--text-primary)] hover:text-[var(--brand-700)] transition-colors line-clamp-1">
                          {course.title}
                        </Link>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">ID: {course._id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-[var(--bg-elevated)] px-2.5 py-1 rounded-md text-xs border border-[var(--border-subtle)]">
                      {course.category?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-[var(--text-secondary)]">
                    {course.lessonCount}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="font-medium text-[var(--text-primary)]">{(course.learnerCount || 0).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge text-xs px-2 py-0.5 ${
                      course.status === 'published' ? 'badge-success' :
                      course.status === 'draft' ? 'badge-warning' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                    }`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/admin/courses/${course._id}`} className="p-1.5 hover:bg-[var(--bg-elevated)] rounded text-[var(--text-secondary)] hover:text-[var(--brand-700)] transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        className="p-1.5 hover:bg-red-500/10 rounded text-[var(--text-secondary)] hover:text-red-600 transition-colors"
                        title="Delete"
                        onClick={() => {
                          if (confirm(`Delete "${course.title}"? This cannot be undone.`)) {
                            deleteMutation.mutate(course._id);
                          }
                        }}
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
