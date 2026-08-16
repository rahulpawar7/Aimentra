'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Shield, Monitor, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function SecurityPage() {
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const qc = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: async () => {
      const { data } = await api.get('/users/sessions');
      return data.data || [];
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => api.put('/auth/change-password', {
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    }),
    onSuccess: () => {
      toast.success('Password changed. Please sign in again.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to change password'),
  });

  const revokeSession = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/users/sessions/${sessionId}`),
    onSuccess: () => { toast.success('Session revoked'); qc.invalidateQueries({ queryKey: ['user-sessions'] }); },
  });

  const revokeAll = useMutation({
    mutationFn: () => api.delete('/users/sessions'),
    onSuccess: () => { toast.success('All other sessions revoked'); qc.invalidateQueries({ queryKey: ['user-sessions'] }); },
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    changePasswordMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Security</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage your password and active sessions.</p>
      </div>

      <div className="glass-card p-6 space-y-4">
        <h2 className="font-bold flex items-center gap-2"><Lock className="w-5 h-5" /> Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-3 max-w-md">
          <input type="password" placeholder="Current password" className="input-base w-full" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
          <input type="password" placeholder="New password" className="input-base w-full" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required />
          <input type="password" placeholder="Confirm new password" className="input-base w-full" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} required />
          <button type="submit" className="btn-brand px-5 py-2 text-sm" disabled={changePasswordMutation.isPending}>Update Password</button>
        </form>
      </div>

      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2"><Monitor className="w-5 h-5" /> Active Sessions</h2>
          {sessions.length > 1 && (
            <button onClick={() => revokeAll.mutate()} className="text-sm text-red-600 hover:underline">Revoke all others</button>
          )}
        </div>
        {isLoading ? <div className="skeleton h-16 w-full rounded" /> : sessions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No active sessions found.</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s: any) => (
              <div key={s.sessionId || s._id} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] p-3 text-sm">
                <div>
                  <p className="font-medium">{s.userAgent?.slice(0, 60) || 'Unknown device'}</p>
                  <p className="text-xs text-[var(--text-muted)]">Last active: {s.lastUsedAt ? formatDate(s.lastUsedAt) : '—'}</p>
                </div>
                <button onClick={() => revokeSession.mutate(s.sessionId)} className="p-2 text-[var(--text-muted)] hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card p-4 flex items-start gap-3 text-sm text-[var(--text-secondary)]">
        <Shield className="w-5 h-5 shrink-0 text-[var(--brand-700)]" />
        <p>Use a strong unique password and revoke sessions on devices you no longer use.</p>
      </div>
    </div>
  );
}
