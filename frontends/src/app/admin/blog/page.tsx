'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AdminBlogPage() {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blog'],
    queryFn: async () => {
      const { data } = await api.get('/blog', { params: { limit: 50, all: 'true' } });
      return data.data?.posts ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (body: any) => editItem ? api.put(`/blog/${editItem._id}`, body) : api.post('/blog', body),
    onSuccess: () => { toast.success('Saved'); qc.invalidateQueries({ queryKey: ['admin-blog'] }); setShowModal(false); setEditItem(null); },
    onError: () => toast.error('Failed to save'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/blog/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['admin-blog'] }); },
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold">Blog Posts</h1><p className="text-[var(--text-secondary)] mt-1">Manage articles shown on /blog</p></div>
        <button onClick={() => { setEditItem(null); setShowModal(true); }} className="btn-brand flex items-center gap-2"><Plus className="w-4 h-4" /> New Post</button>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-surface)] border-b"><tr>
            <th className="px-6 py-4">Title</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Date</th><th className="px-6 py-4 text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? <tr><td colSpan={5} className="px-6 py-8"><div className="skeleton h-8 w-full" /></td></tr>
            : !data?.length ? <tr><td colSpan={5} className="px-6 py-8 text-center text-[var(--text-muted)]">No posts yet</td></tr>
            : data.map((p: any) => (
              <tr key={p._id} className="hover:bg-[var(--bg-surface)]">
                <td className="px-6 py-4 font-medium">{p.title}</td>
                <td className="px-6 py-4">{p.category}</td>
                <td className="px-6 py-4"><span className={`badge text-xs ${p.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span></td>
                <td className="px-6 py-4 text-[var(--text-muted)]">{formatDate(p.publishedAt || p.createdAt)}</td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => { setEditItem(p); setShowModal(true); }} className="p-1.5 hover:bg-[var(--bg-elevated)] rounded"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(p._id); }} className="p-1.5 hover:bg-red-500/10 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg border max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex justify-between sticky top-0 bg-[var(--bg-card)]"><h3 className="font-bold">{editItem ? 'Edit Post' : 'New Post'}</h3><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <form className="p-6 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              saveMutation.mutate({ title: fd.get('title'), content: fd.get('content'), excerpt: fd.get('excerpt'), category: fd.get('category'), status: fd.get('status'), coverImage: fd.get('coverImage') });
            }}>
              <input name="title" defaultValue={editItem?.title} placeholder="Title" className="input-base w-full" required />
              <input name="category" defaultValue={editItem?.category || 'General'} placeholder="Category" className="input-base w-full" />
              <input name="coverImage" defaultValue={editItem?.coverImage} placeholder="Cover Image URL" className="input-base w-full" />
              <textarea name="excerpt" defaultValue={editItem?.excerpt} placeholder="Excerpt" className="input-base w-full min-h-[60px]" />
              <textarea name="content" defaultValue={editItem?.content} placeholder="Content (HTML ok)" className="input-base w-full min-h-[120px]" required />
              <select name="status" defaultValue={editItem?.status || 'draft'} className="input-base w-full">
                <option value="draft">Draft</option><option value="published">Published</option>
              </select>
              <button type="submit" className="btn-brand w-full py-2.5" disabled={saveMutation.isPending}>Save</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
