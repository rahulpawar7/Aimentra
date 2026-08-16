'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Plus, Search, ChevronDown, Calendar, AlertCircle, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSupportTickets, getSupportTicket, createSupportTicket, replySupportTicket } from '@/lib/services';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

export default function SupportPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newTicket, setNewTicket] = useState({ subject: '', category: 'Technical / Bug', content: '' });
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: getSupportTickets,
  });

  const { data: ticketDetail } = useQuery({
    queryKey: ['support-ticket', selectedTicket],
    queryFn: () => getSupportTicket(selectedTicket!),
    enabled: !!selectedTicket,
  });

  const createMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: (ticket) => {
      toast.success('Ticket created');
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
      setIsModalOpen(false);
      setSelectedTicket(ticket.ticketId || ticket._id);
      setNewTicket({ subject: '', category: 'Technical / Bug', content: '' });
    },
    onError: () => toast.error('Failed to create ticket'),
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => replySupportTicket(id, content),
    onSuccess: () => {
      toast.success('Reply sent');
      setReplyText('');
      qc.invalidateQueries({ queryKey: ['support-ticket', selectedTicket] });
    },
    onError: () => toast.error('Failed to send reply'),
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: 'badge-error', in_progress: 'badge-warning', waiting: 'badge-warning',
      resolved: 'badge-success', closed: 'badge-success',
    };
    return <span className={`badge text-xs ${map[status] || ''}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div className="mx-auto flex h-full min-h-[70dvh] max-w-6xl flex-col space-y-6 animate-fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Support Center</h1>
          <p className="text-[var(--text-secondary)] mt-1">Get help with your account or courses.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-brand flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        <div className={`w-full lg:w-1/3 glass-card overflow-hidden flex flex-col ${selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-16 m-2 rounded-xl" />)
            ) : !tickets?.length ? (
              <div className="p-8 text-center text-[var(--text-muted)]">No tickets yet</div>
            ) : tickets.map((ticket: any) => (
              <button
                key={ticket._id}
                onClick={() => setSelectedTicket(ticket.ticketId || ticket._id)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${selectedTicket === (ticket.ticketId || ticket._id) ? 'bg-[var(--bg-surface)] border-[var(--brand-500)]/30' : 'border-transparent hover:bg-[var(--bg-elevated)]'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-[var(--text-muted)]">{ticket.ticketId}</span>
                  {getStatusBadge(ticket.status)}
                </div>
                <h4 className="text-sm font-semibold truncate">{ticket.subject}</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">{formatDate(ticket.createdAt)}</p>
              </button>
            ))}
          </div>
        </div>

        <div className={`w-full lg:w-2/3 glass-card flex flex-col overflow-hidden ${!selectedTicket ? 'hidden lg:flex' : 'flex'}`}>
          {selectedTicket && ticketDetail ? (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-[var(--border-subtle)]">
                <button className="lg:hidden text-[var(--brand-700)] text-sm mb-4" onClick={() => setSelectedTicket(null)}>&larr; Back</button>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold">{ticketDetail.subject}</h2>
                  {getStatusBadge(ticketDetail.status)}
                </div>
                <div className="flex gap-4 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(ticketDetail.createdAt)}</span>
                  <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {ticketDetail.category}</span>
                  <span className="font-mono">{ticketDetail.ticketId}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {(ticketDetail.messages || []).map((msg: any, i: number) => {
                  const isAdmin = msg.role === 'admin' || msg.role === 'support';
                  return (
                    <div key={i} className={`flex gap-4 max-w-[85%] ${isAdmin ? 'ml-auto justify-end' : ''}`}>
                      {!isAdmin && (
                        <div className="w-8 h-8 rounded-full bg-[var(--brand-500)] flex items-center justify-center text-xs font-bold shrink-0">
                          {user?.name?.[0] || 'U'}
                        </div>
                      )}
                      <div className={`p-4 rounded-2xl border ${isAdmin ? 'bg-[var(--brand-500)]/10 border-[var(--brand-500)]/20 rounded-tr-sm' : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] rounded-tl-sm'}`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        <span className="text-[10px] text-[var(--text-muted)] block mt-2">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {isAdmin && (
                        <div className="w-8 h-8 rounded-full bg-[var(--navy-800)] flex items-center justify-center text-white shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {ticketDetail.status !== 'closed' && ticketDetail.status !== 'resolved' && (
                <div className="p-4 border-t border-[var(--border-subtle)]">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="input-base w-full min-h-[80px] resize-none mb-3 text-sm"
                  />
                  <button
                    onClick={() => replyMutation.mutate({ id: selectedTicket, content: replyText })}
                    disabled={!replyText.trim() || replyMutation.isPending}
                    className="btn-brand px-6 py-2"
                  >
                    Send Reply
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <MessageSquare className="w-12 h-12 text-[var(--brand-700)] mb-4" />
              <h3 className="text-xl font-bold mb-2">How can we help?</h3>
              <p className="text-[var(--text-secondary)] max-w-sm mb-6">Select a ticket or create a new one.</p>
              <button onClick={() => setIsModalOpen(true)} className="btn-brand">Create New Ticket</button>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md border border-[var(--border-subtle)] shadow-2xl">
            <div className="p-5 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Create Support Ticket</h3>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(newTicket); }}>
              <select className="input-base w-full text-sm" value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}>
                <option>Technical / Bug</option>
                <option>Billing / Invoice</option>
                <option>Course Access</option>
                <option>Certificate Issue</option>
                <option>Other</option>
              </select>
              <input type="text" className="input-base w-full text-sm" placeholder="Subject" required value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} />
              <textarea className="input-base w-full min-h-[120px] resize-none text-sm" placeholder="Describe your issue..." required value={newTicket.content} onChange={(e) => setNewTicket({ ...newTicket, content: e.target.value })} />
              <button type="submit" className="btn-brand w-full py-2.5" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
