'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { revokeUserAccess } from '@/lib/services';

export default function AdminEntitlementsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-entitlements', statusFilter],
    queryFn: async () => {
      const { data } = await api.get('/admin/entitlements', { params: statusFilter ? { status: statusFilter } : {} });
      return data.data;
    },
  });

  const revokeMutation = useMutation({
    mutationFn: ({ userId, entitlementId }: { userId: string; entitlementId: string }) =>
      revokeUserAccess(userId, entitlementId),
    onSuccess: () => {
      toast.success('Access revoked');
      qc.invalidateQueries({ queryKey: ['admin-entitlements'] });
    },
    onError: () => toast.error('Failed to revoke access'),
  });

  const entitlements = data?.entitlements ?? [];

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Entitlements</h1>
          <p className="text-[var(--text-secondary)] mt-1">View and manage user access grants.</p>
        </div>
        <select className="input-base px-3 py-1.5 text-sm w-full sm:w-44" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Plan</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Expires</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? (
              <tr><td colSpan={6} className="px-6 py-8"><div className="skeleton h-8 w-full" /></td></tr>
            ) : entitlements.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-[var(--text-muted)]">No entitlements found</td></tr>
            ) : entitlements.map((e: any) => (
              <tr key={e._id} className="hover:bg-[var(--bg-surface)]">
                <td className="px-6 py-4">
                  <p className="font-medium">{e.userId?.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{e.userId?.email}</p>
                </td>
                <td className="px-6 py-4">{e.planId?.name || '—'}</td>
                <td className="px-6 py-4"><span className={`badge text-xs ${e.status === 'active' ? 'badge-success' : 'badge-error'}`}>{e.status}</span></td>
                <td className="px-6 py-4">{e.lifetime ? 'Lifetime' : e.expiryDate ? formatDate(e.expiryDate) : '—'}</td>
                <td className="px-6 py-4 capitalize">{e.source?.replace('_', ' ')}</td>
                <td className="px-6 py-4 text-right">
                  {e.status === 'active' && e.userId?._id ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Revoke this access grant?')) {
                          revokeMutation.mutate({ userId: e.userId._id, entitlementId: e._id });
                        }
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Revoke
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
