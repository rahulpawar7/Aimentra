'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HeadphonesIcon, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminSupportPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const qc = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: async () => {
      const { data } = await api.get('/support/admin/all');
      return data.data || [];
    },
  });

  const { data: ticketDetail } = useQuery({
    queryKey: ['admin-support-ticket', selectedId],
    queryFn: async () => {
      const { data } = await api.get(`/support/admin/${selectedId}`);
      return data.data;
    },
    enabled: !!selectedId,
  });

  const replyMutation = useMutation({
    mutationFn: () => api.post(`/support/admin/${selectedId}/reply`, { content: reply }),
    onSuccess: () => {
      toast.success('Reply sent');
      setReply('');
      qc.invalidateQueries({ queryKey: ['admin-support-ticket', selectedId] });
      qc.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
    onError: () => toast.error('Failed to send reply'),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/support/admin/${selectedId}/status`, { status }),
    onSuccess: () => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['admin-support-ticket', selectedId] });
      qc.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><HeadphonesIcon className="w-6 h-6" /> Support Tickets</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage and respond to user support requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
        <div className="glass-card overflow-hidden lg:col-span-1">
          <div className="p-4 border-b border-[var(--border-subtle)] font-semibold">Open Tickets</div>
          <div className="divide-y divide-[var(--border-subtle)] max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4"><div className="skeleton h-12 w-full" /></div>
            ) : tickets.length === 0 ? (
              <p className="p-6 text-center text-[var(--text-muted)] text-sm">No tickets</p>
            ) : tickets.map((t: any) => (
              <button
                key={t._id}
                type="button"
                onClick={() => setSelectedId(t._id)}
                className={`w-full text-left p-4 hover:bg-[var(--bg-surface)] ${selectedId === t._id ? 'bg-[var(--brand-500)]/5' : ''}`}
              >
                <p className="font-medium text-sm truncate">{t.subject}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{t.ticketId} · {t.status}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card lg:col-span-2 flex flex-col">
          {!selectedId || !ticketDetail ? (
            <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
              <div className="text-center"><MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" /><p>Select a ticket to view</p></div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">{ticketDetail.subject}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{ticketDetail.ticketId} · {formatDate(ticketDetail.createdAt)}</p>
                </div>
                <select
                  value={ticketDetail.status}
                  onChange={(e) => statusMutation.mutate(e.target.value)}
                  className="input-base text-sm px-2 py-1"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                {ticketDetail.messages?.map((msg: any, i: number) => (
                  <div key={i} className={`p-3 rounded-lg text-sm ${msg.role === 'admin' ? 'bg-[var(--brand-500)]/10 ml-8' : 'bg-[var(--bg-surface)] mr-8'}`}>
                    <p className="text-xs font-semibold mb-1 capitalize">{msg.role}</p>
                    <p className="text-[var(--text-secondary)]">{msg.content}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-[var(--border-subtle)] flex gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your reply..."
                  className="input-base flex-1"
                />
                <button
                  type="button"
                  onClick={() => replyMutation.mutate()}
                  disabled={!reply.trim() || replyMutation.isPending}
                  className="btn-brand px-4"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
