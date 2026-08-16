'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Save, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { getUserProfile, updateUserProfile, getUserSubscription } from '@/lib/services';
import { formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore();
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '', billingName: '', gstin: '', billingAddress: '' });

  const { data: profile } = useQuery({ queryKey: ['user-profile'], queryFn: getUserProfile });
  const { data: subscription } = useQuery({ queryKey: ['user-subscription'], queryFn: getUserSubscription });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        phone: profile.phone || '',
        billingName: profile.billingInfo?.name || '',
        gstin: profile.billingInfo?.gstin || '',
        billingAddress: profile.billingInfo?.address || '',
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => updateUserProfile({
      name: form.name,
      phone: form.phone,
      billingInfo: { name: form.billingName, gstin: form.gstin, address: form.billingAddress },
    }),
    onSuccess: async () => {
      toast.success('Profile updated');
      await fetchMe();
      qc.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: () => toast.error('Failed to save profile'),
  });

  const activePlan = subscription?.[0]?.planId;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Profile Settings</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage your account details and billing information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-[image:var(--gradient-brand)] flex items-center justify-center text-[var(--navy-900)] text-4xl font-bold shadow-xl border-4 border-[var(--bg-base)] mb-4">
              {user?.name?.[0] || 'U'}
            </div>
            <h3 className="font-bold text-lg">{user?.name || 'Student'}</h3>
            <p className="text-sm text-[var(--text-muted)] mb-3">{user?.email}</p>
            {activePlan && <span className="badge badge-brand">{activePlan.name}</span>}
          </div>

          {activePlan && (
            <div className="glass-card p-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[var(--text-muted)]" /> Active Subscription
              </h4>
              <div className="bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-subtle)]">
                <p className="font-bold">{activePlan.name}</p>
                {subscription?.[0]?.expiryDate && !subscription[0].lifetime && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Expires: {formatDate(subscription[0].expiryDate)}</p>
                )}
                {subscription?.[0]?.lifetime && (
                  <p className="text-xs text-green-600 mt-1">Lifetime Access</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="glass-card p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold border-b border-[var(--border-subtle)] pb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2"><User className="w-4 h-4" /> Full Name</label>
                <input type="text" className="input-base w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2"><Mail className="w-4 h-4" /> Email</label>
                <input type="email" className="input-base w-full bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-not-allowed" value={user?.email || ''} readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2"><Phone className="w-4 h-4" /> Phone</label>
                <input type="tel" className="input-base w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
              </div>
            </div>

            <h3 className="text-lg font-bold border-b border-[var(--border-subtle)] pb-4 mt-4">Billing Information</h3>
            <div className="space-y-4">
              <input type="text" className="input-base w-full" placeholder="Billing Name / Company" value={form.billingName} onChange={(e) => setForm({ ...form, billingName: e.target.value })} />
              <input type="text" className="input-base w-full" placeholder="GSTIN (Optional)" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
              <textarea className="input-base w-full min-h-[100px] resize-none" placeholder="Billing Address" value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} />
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" className="btn-brand flex items-center gap-2 px-8" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
