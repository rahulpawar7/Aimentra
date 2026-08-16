'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminEventsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-events'],
    queryFn: async () => {
      const { data } = await api.get('/events', { params: { limit: 50 } });
      return data.data?.events ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (body: any) => editItem ? api.put(`/events/${editItem._id}`, body) : api.post('/events', body),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['admin-events'] }); setShowModal(false); setEditItem(null); },
    onError: () => toast.error('Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/events/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-events'] }); },
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Events</h1><p className="text-[var(--text-secondary)] mt-1">Manage live events shown on /events</p></div>
        <button onClick={() => { setEditItem(null); setShowModal(true); }} className="btn-brand flex items-center gap-2"><Plus className="w-4 h-4" /> New Event</button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-surface)] border-b"><tr>
            <th className="px-6 py-4">Title</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Type</th><th className="px-6 py-4 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? <tr><td colSpan={5} className="px-6 py-8"><div className="skeleton h-8 w-full" /></td></tr>
            : !data?.length ? <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--text-muted)]">No events yet</td></tr>
            : data.map((e: any) => (
              <tr key={e._id} className="hover:bg-[var(--bg-surface)]">
                <td className="px-6 py-4 font-medium">{e.title}</td>
                <td className="px-6 py-4">{formatDate(e.date)}</td>
                <td className="px-6 py-4"><span className="badge text-xs">{e.status}</span></td>
                <td className="px-6 py-4">{e.isOnline ? 'Online' : 'In-Person'}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => { setEditItem(e); setShowModal(true); }} className="p-1.5 hover:bg-[var(--bg-elevated)] rounded"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(e._id); }} className="p-1.5 hover:bg-red-500/10 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg border max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between"><h3 className="font-bold">{editItem ? 'Edit Event' : 'New Event'}</h3><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <form className="p-6 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              saveMutation.mutate({
                title: fd.get('title'), description: fd.get('description'),
                date: new Date(fd.get('date') as string).toISOString(),
                endDate: new Date(fd.get('endDate') as string).toISOString(),
                timezone: 'Asia/Kolkata', isOnline: fd.get('isOnline') === 'true',
                venue: fd.get('venue'), capacity: Number(fd.get('capacity')) || undefined,
                status: fd.get('status'), price: 0,
              });
            }}>
              <input name="title" defaultValue={editItem?.title} placeholder="Title" className="input-base w-full" required />
              <textarea name="description" defaultValue={editItem?.description} placeholder="Description" className="input-base w-full min-h-[80px]" required />
              <input name="date" type="datetime-local" defaultValue={editItem?.date ? new Date(editItem.date).toISOString().slice(0, 16) : ''} className="input-base w-full" required />
              <input name="endDate" type="datetime-local" defaultValue={editItem?.endDate ? new Date(editItem.endDate).toISOString().slice(0, 16) : ''} className="input-base w-full" required />
              <select name="isOnline" defaultValue={editItem?.isOnline !== false ? 'true' : 'false'} className="input-base w-full">
                <option value="true">Online</option><option value="false">In-Person</option>
              </select>
              <input name="venue" defaultValue={editItem?.venue} placeholder="Venue (if in-person)" className="input-base w-full" />
              <input name="capacity" type="number" defaultValue={editItem?.capacity} placeholder="Capacity" className="input-base w-full" />
              <select name="status" defaultValue={editItem?.status || 'upcoming'} className="input-base w-full">
                <option value="upcoming">Upcoming</option><option value="live">Live</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
              </select>
              <button type="submit" className="btn-brand w-full py-2.5" disabled={saveMutation.isPending}>Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
