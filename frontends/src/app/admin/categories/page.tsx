'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function AdminCategoriesPage() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories/admin/all');
      return data.data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (body: any) => editItem ? api.put(`/categories/${editItem._id}`, body) : api.post('/categories', body),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['admin-categories'] }); setShowModal(false); setEditItem(null); },
    onError: () => toast.error('Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-categories'] }); },
    onError: () => toast.error('Cannot delete — category may be in use'),
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Categories</h1><p className="text-[var(--text-secondary)] mt-1">Organize courses by category</p></div>
        <button onClick={() => { setEditItem(null); setShowModal(true); }} className="btn-brand flex items-center gap-2"><Plus className="w-4 h-4" /> Add Category</button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-surface)] border-b"><tr>
            <th className="px-6 py-4">Name</th><th className="px-6 py-4">Slug</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? <tr><td colSpan={4} className="px-6 py-8"><div className="skeleton h-8 w-full" /></td></tr>
            : data?.map((c: any) => (
              <tr key={c._id} className="hover:bg-[var(--bg-surface)]">
                <td className="px-6 py-4 font-medium">{c.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-[var(--text-muted)]">{c.slug}</td>
                <td className="px-6 py-4"><span className={`badge text-xs ${c.active ? 'badge-success' : 'badge-error'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => { setEditItem(c); setShowModal(true); }} className="p-1.5 hover:bg-[var(--bg-elevated)] rounded"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm('Delete category?')) deleteMutation.mutate(c._id); }} className="p-1.5 hover:bg-red-500/10 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md border">
            <div className="p-5 border-b flex justify-between"><h3 className="font-bold">{editItem ? 'Edit' : 'Add'} Category</h3><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <form className="p-6 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const name = fd.get('name') as string;
              saveMutation.mutate({ name, slug: name.toLowerCase().replace(/\s+/g, '-'), description: fd.get('description'), active: fd.get('active') === 'true' });
            }}>
              <input name="name" defaultValue={editItem?.name} placeholder="Category name" className="input-base w-full" required />
              <textarea name="description" defaultValue={editItem?.description} placeholder="Description" className="input-base w-full min-h-[60px]" />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="active" value="true" defaultChecked={editItem?.active !== false} /> Active</label>
              <button type="submit" className="btn-brand w-full py-2.5" disabled={saveMutation.isPending}>Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
