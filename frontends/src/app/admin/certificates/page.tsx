'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminCertificatesPage() {
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: async () => {
      const { data } = await api.get('/admin/certificates');
      return data.data;
    },
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold">Certificates</h1>
        <p className="text-[var(--text-secondary)] mt-1">All issued completion certificates.</p>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
            <tr>
              <th className="px-6 py-4">Certificate #</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Issued</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8"><div className="skeleton h-8 w-full" /></td></tr>
            ) : !certificates?.length ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--text-muted)]">No certificates issued yet</td></tr>
            ) : certificates.map((c: any) => (
              <tr key={c._id} className="hover:bg-[var(--bg-surface)]">
                <td className="px-6 py-4 font-mono text-xs">{c.certificateNumber}</td>
                <td className="px-6 py-4">{c.studentName || c.userId?.name}</td>
                <td className="px-6 py-4">{c.courseName || c.courseId?.title}</td>
                <td className="px-6 py-4">{formatDate(c.issuedAt)}</td>
                <td className="px-6 py-4"><span className="badge badge-success text-xs">{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
