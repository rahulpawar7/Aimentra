'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Edit2, Power, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminPlans, togglePlan, createPlan, updatePlan } from '@/lib/services';
import { formatCurrency } from '@/lib/utils';

export default function AdminPlansPage() {
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const qc = useQueryClient();

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: getAdminPlans,
  });

  const toggleMutation = useMutation({
    mutationFn: togglePlan,
    onSuccess: () => { toast.success('Plan status updated'); qc.invalidateQueries({ queryKey: ['admin-plans'] }); },
    onError: () => toast.error('Failed to update plan'),
  });

  const saveMutation = useMutation({
    mutationFn: async (body: any) => editPlan ? updatePlan(editPlan._id, body) : createPlan(body),
    onSuccess: () => {
      toast.success(editPlan ? 'Plan updated' : 'Plan created');
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      setShowModal(false);
      setEditPlan(null);
    },
    onError: () => toast.error('Failed to save plan'),
  });

  const allFeatures = [
    'Access to Free Courses',
    'Premium Course Catalog',
    'Source Code Downloads',
    'Official Certificates',
    'Priority 1-on-1 Support',
  ];

  const getInterval = (plan: any) => {
    if (plan.lifetime) return ' lifetime';
    if (plan.billingType === 'annual') return '/yr';
    if (plan.billingType === 'one_time') return ' once';
    return '';
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Subscription Plans</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage pricing tiers and feature entitlements.</p>
        </div>
        <button onClick={() => { setEditPlan(null); setShowModal(true); }} className="btn-brand flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-[400px] rounded-2xl" />)
        ) : plans?.map((plan: any) => (
          <div key={plan._id} className={`glass-card relative overflow-hidden flex flex-col ${plan.status !== 'active' ? 'opacity-60' : ''} ${plan.featured ? 'border-[var(--brand-500)]' : ''}`}>
            {plan.featured && <div className="absolute top-0 inset-x-0 h-1 bg-gradient-brand" />}
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                <button onClick={() => { setEditPlan(plan); setShowModal(true); }} className="p-1.5 hover:bg-[var(--bg-surface)] rounded-md text-[var(--text-muted)]">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-extrabold">{plan.price === 0 ? 'Free' : formatCurrency(plan.price)}</span>
                <span className="text-[var(--text-muted)]">{getInterval(plan)}</span>
              </div>
              {plan.badge && <span className="badge badge-brand mb-4">{plan.badge}</span>}
              <div className="space-y-3">
                {(plan.highlights || plan.features || []).slice(0, 5).map((f: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-[var(--text-primary)]">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 flex justify-between items-center">
              <span className={`text-xs font-bold uppercase ${plan.status === 'active' ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                {plan.status}
              </span>
              <button onClick={() => toggleMutation.mutate(plan._id)} className="p-1.5 rounded-md border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]" title="Toggle status">
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg border border-[var(--border-subtle)] shadow-2xl">
            <div className="p-5 border-b border-[var(--border-subtle)] flex justify-between items-center">
              <h3 className="text-lg font-bold">{editPlan ? 'Edit Plan' : 'Create Plan'}</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form className="p-6 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              saveMutation.mutate({
                name: fd.get('name'),
                slug: (fd.get('name') as string).toLowerCase().replace(/\s+/g, '-'),
                description: fd.get('description') || 'Plan description',
                price: Number(fd.get('price')),
                billingType: fd.get('billingType') || 'one_time',
                lifetime: fd.get('billingType') === 'lifetime',
                status: editPlan?.status || 'active',
                featured: editPlan?.featured || false,
                features: editPlan?.features || ['course.access', 'certificate.generate'],
                highlights: editPlan?.highlights?.length ? editPlan.highlights : [(fd.get('description') as string) || 'Full access'],
              });
            }}>
              <input name="name" defaultValue={editPlan?.name} placeholder="Plan name" className="input-base w-full" required />
              <textarea name="description" defaultValue={editPlan?.description} placeholder="Description" className="input-base w-full min-h-[80px]" />
              <input name="price" type="number" defaultValue={editPlan?.price ?? 0} placeholder="Price (INR)" className="input-base w-full" required />
              <select name="billingType" defaultValue={editPlan?.billingType || 'annual'} className="input-base w-full">
                <option value="one_time">One Time</option>
                <option value="annual">Annual</option>
                <option value="lifetime">Lifetime</option>
              </select>
              <button type="submit" className="btn-brand w-full py-2.5" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving...' : 'Save Plan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
