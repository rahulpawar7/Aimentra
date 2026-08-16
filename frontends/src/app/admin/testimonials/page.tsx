'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function AdminTestimonialsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: async () => {
      const { data } = await api.get('/testimonials', { params: { all: 'true' } });
      return data.data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (body: any) => editItem ? api.put(`/testimonials/${editItem._id}`, body) : api.post('/testimonials', body),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['admin-testimonials'] }); setShowModal(false); setEditItem(null); },
    onError: () => toast.error('Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/testimonials/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-testimonials'] }); },
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Testimonials</h1><p className="text-[var(--text-secondary)] mt-1">Manage reviews shown on the homepage</p></div>
        <button onClick={() => { setEditItem(null); setShowModal(true); }} className="btn-brand flex items-center gap-2"><Plus className="w-4 h-4" /> Add Testimonial</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {isLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)
        : !data?.length ? <p className="text-[var(--text-muted)] col-span-2 text-center py-8">No testimonials yet</p>
        : data.map((t: any) => (
          <div key={t._id} className="glass-card p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold">{t.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{t.designation}{t.company ? `, ${t.company}` : ''}</p>
              </div>
              <div className="flex gap-1">
                {t.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                <button onClick={() => { setEditItem(t); setShowModal(true); }} className="p-1 hover:bg-[var(--bg-elevated)] rounded"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(t._id); }} className="p-1 hover:bg-red-500/10 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] line-clamp-3">{t.content}</p>
            <div className="flex gap-2 mt-3">
              <span className={`badge text-xs ${t.approved ? 'badge-success' : 'badge-warning'}`}>{t.approved ? 'Approved' : 'Pending'}</span>
              <span className="badge text-xs">{'★'.repeat(t.rating)}</span>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md border">
            <div className="p-5 border-b flex justify-between"><h3 className="font-bold">{editItem ? 'Edit' : 'Add'} Testimonial</h3><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <form className="p-6 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              saveMutation.mutate({
                name: fd.get('name'), designation: fd.get('designation'), company: fd.get('company'),
                content: fd.get('content'), rating: Number(fd.get('rating')),
                featured: fd.get('featured') === 'true', approved: fd.get('approved') === 'true',
              });
            }}>
              <input name="name" defaultValue={editItem?.name} placeholder="Name" className="input-base w-full" required />
              <input name="designation" defaultValue={editItem?.designation} placeholder="Designation" className="input-base w-full" />
              <input name="company" defaultValue={editItem?.company} placeholder="Company" className="input-base w-full" />
              <textarea name="content" defaultValue={editItem?.content} placeholder="Testimonial text" className="input-base w-full min-h-[80px]" required />
              <input name="rating" type="number" min={1} max={5} defaultValue={editItem?.rating || 5} className="input-base w-full" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" value="true" defaultChecked={editItem?.featured} /> Featured on homepage</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="approved" value="true" defaultChecked={editItem?.approved !== false} /> Approved</label>
              <button type="submit" className="btn-brand w-full py-2.5" disabled={saveMutation.isPending}>Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
