'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitContactForm } from '@/lib/services';

type ContactCMS = {
  title?: string;
  subtitle?: string;
  supportHours?: string;
  supportEmail?: string;
  supportPhone?: string;
  officeAddress?: string;
};

export default function ContactPage({ cms }: { cms?: ContactCMS }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const contactInfo = [
    { icon: Mail, label: 'Email', value: cms?.supportEmail || 'support@aimentra.com' },
    { icon: Phone, label: 'Phone', value: cms?.supportPhone || '' },
    { icon: MapPin, label: 'Office', value: cms?.officeAddress || '' },
  ].filter((c) => c.value);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContactForm(form);
      toast.success('Thanks for reaching out! Our team will get back to you within 24 hours.');
      setForm({ name: '', email: '', message: '' });
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="surface-dark relative overflow-hidden py-14 text-center sm:py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--gradient-glow)' }} />
        <div className="container relative z-10 mx-auto max-w-2xl px-4">
          <h1 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl">{cms?.title || 'Get in Touch'}</h1>
          <p className="text-base text-muted-on-dark sm:text-lg">{cms?.subtitle || "Have a question? We're here to help."}</p>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr] lg:gap-12">
          <div className="space-y-5">
            {contactInfo.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-card)]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-500)]/10 text-[var(--brand-600)]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
                  <p className="mt-0.5 font-semibold text-[var(--text-primary)]">{value}</p>
                </div>
              </div>
            ))}
            {cms?.supportHours && (
              <div className="flex items-start gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-card)]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-500)]/10 text-[var(--brand-600)]">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Support Hours</p>
                  <p className="mt-0.5 font-semibold text-[var(--text-primary)]">{cms.supportHours}</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)] sm:p-8">
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">Full Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-base" placeholder="Your name" />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">Email Address</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-base" placeholder="you@example.com" />
            </div>
            <div className="mb-6">
              <label className="mb-1.5 block text-sm font-semibold text-[var(--text-secondary)]">Message</label>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-base resize-none" placeholder="How can we help you?" />
            </div>
            <button type="submit" disabled={submitting} className="btn-brand w-full gap-2">
              <Send className="h-4 w-4" />
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
