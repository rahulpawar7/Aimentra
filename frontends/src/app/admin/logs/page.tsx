'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAuditLog } from '@/lib/services';
import { formatDate } from '@/lib/utils';

export default function AdminLogsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', page],
    queryFn: () => getAuditLog({ page, limit: 30 }),
  });

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-[var(--text-secondary)] mt-1">Track admin actions and system events.</p>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
            <tr>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Actor</th>
              <th className="px-6 py-4">Resource</th>
              <th className="px-6 py-4">IP</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-8"><div className="skeleton h-8 w-full" /></td></tr>
            ) : !Array.isArray(logs) || logs.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--text-muted)]">No audit logs yet</td></tr>
            ) : logs.map((log: any) => (
              <tr key={log._id} className="hover:bg-[var(--bg-surface)]">
                <td className="px-6 py-4 font-mono text-xs">{log.action}</td>
                <td className="px-6 py-4">{log.actorEmail || log.actorRole}</td>
                <td className="px-6 py-4 text-[var(--text-secondary)]">{log.resourceType} {log.resourceId?.slice?.(-6)}</td>
                <td className="px-6 py-4 font-mono text-xs">{log.ip}</td>
                <td className="px-6 py-4 text-xs">{formatDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t flex justify-end gap-2">
          <button className="btn-outline px-3 py-1 text-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <button className="btn-outline px-3 py-1 text-sm" onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      </div>
    </div>
  );
}
