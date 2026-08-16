'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminCoupons, createCoupon, deleteCoupon, updateCoupon } from '@/lib/services';
import { formatDate } from '@/lib/utils';

export default function AdminCouponsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editCoupon, setEditCoupon] = useState<any>(null);
  const qc = useQueryClient();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: getAdminCoupons,
  });

  const createMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: () => { toast.success('Coupon created'); qc.invalidateQueries({ queryKey: ['admin-coupons'] }); setShowModal(false); },
    onError: () => toast.error('Failed to create coupon'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => updateCoupon(id, body),
    onSuccess: () => { toast.success('Coupon updated'); qc.invalidateQueries({ queryKey: ['admin-coupons'] }); setEditCoupon(null); },
    onError: () => toast.error('Failed to update coupon'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: () => { toast.success('Coupon deleted'); qc.invalidateQueries({ queryKey: ['admin-coupons'] }); },
    onError: () => toast.error('Failed to delete coupon'),
  });

  const openCreate = () => { setEditCoupon(null); setShowModal(true); };
  const openEdit = (coupon: any) => { setEditCoupon(coupon); setShowModal(true); };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage discount codes and promotions.</p>
        </div>
        <button onClick={openCreate} className="btn-brand flex items-center gap-2"><Plus className="w-4 h-4" /> Create Coupon</button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Value</th>
              <th className="px-6 py-4">Usage</th>
              <th className="px-6 py-4">Valid Until</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {isLoading ? (
              <tr><td colSpan={7} className="px-6 py-8"><div className="skeleton h-8 w-full" /></td></tr>
            ) : !coupons?.length ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-[var(--text-muted)]">No coupons yet</td></tr>
            ) : coupons.map((c: any) => (
              <tr key={c._id} className="hover:bg-[var(--bg-surface)]">
                <td className="px-6 py-4 font-mono font-bold">{c.code}</td>
                <td className="px-6 py-4 capitalize">{c.type}</td>
                <td className="px-6 py-4">{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</td>
                <td className="px-6 py-4">{c.usageCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                <td className="px-6 py-4">{formatDate(c.validUntil)}</td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => updateMutation.mutate({ id: c._id, body: { active: !c.active } })}
                    className={`badge text-xs cursor-pointer ${c.active ? 'badge-success' : 'badge-error'}`}
                  >
                    {c.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-[var(--bg-elevated)] rounded"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm('Delete coupon?')) deleteMutation.mutate(c._id); }} className="p-1.5 hover:bg-red-500/10 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-md border border-[var(--border-subtle)]">
            <div className="p-5 border-b flex justify-between"><h3 className="font-bold">{editCoupon ? 'Edit Coupon' : 'Create Coupon'}</h3><button onClick={() => { setShowModal(false); setEditCoupon(null); }}><X className="w-5 h-5" /></button></div>
            <form className="p-6 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const body = {
                code: (fd.get('code') as string).toUpperCase(),
                type: fd.get('type'),
                value: Number(fd.get('value')),
                active: fd.get('active') === 'true',
                validFrom: editCoupon?.validFrom || new Date(),
                validUntil: new Date(fd.get('validUntil') as string),
                usageLimit: Number(fd.get('usageLimit')) || undefined,
              };
              if (editCoupon) updateMutation.mutate({ id: editCoupon._id, body });
              else createMutation.mutate(body);
            }}>
              <input name="code" defaultValue={editCoupon?.code} placeholder="COUPON CODE" className="input-base w-full uppercase" required />
              <select name="type" defaultValue={editCoupon?.type || 'percentage'} className="input-base w-full"><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></select>
              <input name="value" type="number" defaultValue={editCoupon?.value} placeholder="Value" className="input-base w-full" required />
              <input name="validUntil" type="date" defaultValue={editCoupon?.validUntil?.slice(0, 10)} className="input-base w-full" required />
              <input name="usageLimit" type="number" defaultValue={editCoupon?.usageLimit} placeholder="Usage limit (optional)" className="input-base w-full" />
              {editCoupon ? (
                <select name="active" defaultValue={editCoupon.active ? 'true' : 'false'} className="input-base w-full">
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              ) : null}
              <button type="submit" className="btn-brand w-full py-2.5" disabled={createMutation.isPending || updateMutation.isPending}>
                {editCoupon ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
