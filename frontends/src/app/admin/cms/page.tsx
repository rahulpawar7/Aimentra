'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, Plus, Trash2 as Trash, LayoutTemplate } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { HomepageEditor, HeroOverlayEditor, SectionHeaderEditor } from './homepage-editors';

type StatItem = { label: string; value: string; suffix: string; metric?: string; decimals?: number };
type FaqItem = { question: string; answer: string };

const TABS = [
  { key: 'homepage', label: 'Homepage Layout' },
  { key: 'hero', label: 'Hero Banner' },
  { key: 'stats', label: 'Stats Bar' },
  { key: 'categories', label: 'Categories Section' },
  { key: 'featuredCourses', label: 'Featured Courses' },
  { key: 'pricingSection', label: 'Pricing Section' },
  { key: 'testimonialsSection', label: 'Testimonials Section' },
  { key: 'faq', label: 'FAQ Section' },
  { key: 'cta', label: 'CTA Section' },
  { key: 'footer', label: 'Footer' },
  { key: 'about', label: 'About Page' },
  { key: 'contact', label: 'Contact Page' },
  { key: 'terms', label: 'Terms' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'refund', label: 'Refund Policy' },
  { key: 'coursesPage', label: 'Courses Page' },
  { key: 'packagesPage', label: 'Packages Page' },
];

export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState('hero');
  const qc = useQueryClient();

  const { data: cms, isLoading } = useQuery({
    queryKey: ['admin-cms'],
    queryFn: async () => {
      const { data } = await api.get('/cms');
      return data.data as Record<string, any>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ key, jsonValue }: { key: string; jsonValue: any }) =>
      api.put(`/admin/cms/${key}`, { jsonValue }),
    onSuccess: () => {
      toast.success('Saved — changes are live on the website');
      qc.invalidateQueries({ queryKey: ['admin-cms'] });
    },
    onError: () => toast.error('Failed to save'),
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--text-primary)]">
          <LayoutTemplate className="h-6 w-6 text-[var(--brand-700)]" /> Website CMS
        </h1>
        <p className="mt-1 text-[var(--text-secondary)]">Edit homepage and static page content shown to visitors — no code changes needed.</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex gap-2 overflow-x-auto border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/30 p-4 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border border-[var(--brand-500)]/20 bg-[var(--brand-500)]/10 text-[var(--brand-700)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 md:p-8">
          {isLoading ? (
            <div className="space-y-3">
              <div className="skeleton h-10 w-full rounded" />
              <div className="skeleton h-10 w-full rounded" />
              <div className="skeleton h-24 w-full rounded" />
            </div>
          ) : (
            <CMSBlockEditor
              tabKey={activeTab}
              value={cms?.[activeTab]}
              onSave={(jsonValue) => saveMutation.mutate({ key: activeTab, jsonValue })}
              saving={saveMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CMSBlockEditor({ tabKey, value, onSave, saving }: { tabKey: string; value: any; onSave: (v: any) => void; saving: boolean }) {
  if (tabKey === 'homepage') return <HomepageEditor value={value} onSave={onSave} saving={saving} />;
  if (tabKey === 'hero') return <HeroOverlayEditor value={value} onSave={onSave} saving={saving} />;
  if (tabKey === 'stats') return <StatsEditor value={value} onSave={onSave} saving={saving} />;
  if (tabKey === 'categories') return <SectionHeaderEditor value={value} onSave={onSave} saving={saving} fields={['title', 'titleAccent', 'subtitle', 'ctaText', 'ctaHref', 'limit']} />;
  if (tabKey === 'featuredCourses') return <SectionHeaderEditor value={value} onSave={onSave} saving={saving} fields={['title', 'titleAccent', 'subtitle', 'ctaText', 'ctaHref', 'limit', 'source', 'categoryId']} />;
  if (tabKey === 'pricingSection') return <SectionHeaderEditor value={value} onSave={onSave} saving={saving} fields={['title', 'subtitle', 'showBillingToggle', 'annualLabel', 'lifetimeLabel', 'lifetimeBadge', 'guaranteeTitle', 'guaranteeText']} />;
  if (tabKey === 'testimonialsSection') return <SectionHeaderEditor value={value} onSave={onSave} saving={saving} fields={['title', 'titleAccent', 'subtitle', 'limit', 'featuredOnly']} />;
  if (tabKey === 'faq') return <FaqEditor value={value} onSave={onSave} saving={saving} />;
  if (tabKey === 'cta') return <CtaEditor value={value} onSave={onSave} saving={saving} />;
  if (tabKey === 'footer') return <FooterEditor value={value} onSave={onSave} saving={saving} />;
  if (tabKey === 'about') return <AboutEditor value={value} onSave={onSave} saving={saving} />;
  if (tabKey === 'contact') return <ContactEditor value={value} onSave={onSave} saving={saving} />;
  if (tabKey === 'coursesPage') return <SectionHeaderEditor value={value} onSave={onSave} saving={saving} fields={['title', 'titleAccent', 'subtitle']} />;
  if (tabKey === 'packagesPage') return <PackagesPageEditor value={value} onSave={onSave} saving={saving} />;
  return <PageContentEditor value={value} onSave={onSave} saving={saving} />;
}

function SaveButton({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <button type="button" onClick={onSave} disabled={saving} className="btn-brand mt-2 flex items-center gap-2 px-5 py-2 text-sm">
      <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

const STAT_METRICS = [
  { value: 'totalStudents', label: 'Total Students' },
  { value: 'publishedCourses', label: 'Published Courses' },
  { value: 'totalCourses', label: 'All Courses' },
  { value: 'activeCategories', label: 'Active Categories' },
  { value: 'totalInstructors', label: 'Instructors' },
  { value: 'totalEnrollments', label: 'Course Enrollments' },
  { value: 'averageRating', label: 'Average Rating' },
  { value: 'totalReviews', label: 'Total Reviews' },
  { value: 'certificatesIssued', label: 'Certificates Issued' },
  { value: 'activeSubscriptions', label: 'Active Subscriptions' },
  { value: 'yearsExperience', label: 'Years Experience' },
  { value: 'totalTestimonials', label: 'Approved Testimonials' },
  { value: 'featuredCourses', label: 'Featured Courses' },
];

function StatsEditor({ value, onSave, saving }: { value: any; onSave: (v: any) => void; saving: boolean }) {
  const [items, setItems] = useState<StatItem[]>([]);
  useEffect(() => setItems(value?.items || []), [value]);

  const update = (idx: number, patch: Partial<StatItem>) => setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const add = () => setItems([...items, { label: '', metric: 'totalStudents', suffix: '', value: '' }]);

  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-sm text-[var(--text-muted)]">
        Values are calculated live from the database. Choose which metric each stat displays.
      </p>
      {items.map((item, idx) => (
        <div key={idx} className="flex flex-col gap-2 rounded-lg border border-[var(--border-subtle)] p-3 sm:flex-row sm:items-end">
          <Field label="Label" value={item.label} onChange={(v) => update(idx, { label: v })} compact />
          <div className="flex-1">
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Database Metric</label>
            <select className="input-base w-full" value={item.metric || 'totalStudents'} onChange={(e) => update(idx, { metric: e.target.value })}>
              {STAT_METRICS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <Field label="Suffix" value={item.suffix} onChange={(v) => update(idx, { suffix: v })} compact />
          <button type="button" onClick={() => remove(idx)} className="mb-0.5 rounded p-2 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-600">
            <Trash className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-sm font-medium text-[var(--brand-700)]">
        <Plus className="h-4 w-4" /> Add Stat
      </button>
      <div><SaveButton onSave={() => onSave({ items: items.map(({ label, metric, suffix, decimals }) => ({ label, metric, suffix, decimals })) })} saving={saving} /></div>
    </div>
  );
}

function FaqEditor({ value, onSave, saving }: { value: any; onSave: (v: any) => void; saving: boolean }) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [items, setItems] = useState<FaqItem[]>([]);
  useEffect(() => {
    if (value) {
      setTitle(value.title || '');
      setSubtitle(value.subtitle || '');
      setItems(value.items || []);
    }
  }, [value]);

  const update = (idx: number, patch: Partial<FaqItem>) => setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const add = () => setItems([...items, { question: '', answer: '' }]);

  return (
    <div className="max-w-2xl space-y-4">
      <Field label="Section Title" value={title} onChange={setTitle} />
      <Field label="Section Subtitle" textarea value={subtitle} onChange={setSubtitle} />
      {items.map((item, idx) => (
        <div key={idx} className="space-y-2 rounded-lg border border-[var(--border-subtle)] p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)]">FAQ {idx + 1}</span>
            <button type="button" onClick={() => remove(idx)} className="rounded p-1 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-600">
              <Trash className="h-4 w-4" />
            </button>
          </div>
          <Field label="Question" value={item.question} onChange={(v) => update(idx, { question: v })} />
          <Field label="Answer" textarea value={item.answer} onChange={(v) => update(idx, { answer: v })} />
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-sm font-medium text-[var(--brand-700)]">
        <Plus className="h-4 w-4" /> Add FAQ
      </button>
      <div><SaveButton onSave={() => onSave({ title, subtitle, items })} saving={saving} /></div>
    </div>
  );
}

function FooterEditor({ value, onSave, saving }: { value: any; onSave: (v: any) => void; saving: boolean }) {
  const [form, setForm] = useState({ tagline: '', contactEmail: '', contactPhone: '', address: '', youtube: '', instagram: '', linkedin: '' });
  useEffect(() => {
    if (value) {
      setForm({
        tagline: value.tagline || '',
        contactEmail: value.contactEmail || '',
        contactPhone: value.contactPhone || '',
        address: value.address || '',
        youtube: value.socialLinks?.youtube || '',
        instagram: value.socialLinks?.instagram || '',
        linkedin: value.socialLinks?.linkedin || '',
      });
    }
  }, [value]);

  const save = () =>
    onSave({
      tagline: form.tagline,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      address: form.address,
      socialLinks: { youtube: form.youtube, instagram: form.instagram, linkedin: form.linkedin },
    });

  return (
    <div className="max-w-2xl space-y-4">
      <Field label="Tagline" value={form.tagline} onChange={(v) => setForm({ ...form, tagline: v })} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Contact Email" value={form.contactEmail} onChange={(v) => setForm({ ...form, contactEmail: v })} />
        <Field label="Contact Phone" value={form.contactPhone} onChange={(v) => setForm({ ...form, contactPhone: v })} />
      </div>
      <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="YouTube URL" value={form.youtube} onChange={(v) => setForm({ ...form, youtube: v })} />
        <Field label="Instagram URL" value={form.instagram} onChange={(v) => setForm({ ...form, instagram: v })} />
        <Field label="LinkedIn URL" value={form.linkedin} onChange={(v) => setForm({ ...form, linkedin: v })} />
      </div>
      <SaveButton onSave={save} saving={saving} />
    </div>
  );
}

function PageContentEditor({ value, onSave, saving }: { value: any; onSave: (v: any) => void; saving: boolean }) {
  const [form, setForm] = useState({ title: '', lastUpdated: '', body: '' });
  useEffect(() => setForm({ title: value?.title || '', lastUpdated: value?.lastUpdated || '', body: value?.body || '' }), [value]);

  return (
    <div className="max-w-2xl space-y-4">
      <Field label="Page Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
      <Field label="Last Updated (display text)" value={form.lastUpdated} onChange={(v) => setForm({ ...form, lastUpdated: v })} />
      <Field label="Page Content (HTML supported)" textarea rows={12} value={form.body} onChange={(v) => setForm({ ...form, body: v })} />
      <SaveButton onSave={() => onSave(form)} saving={saving} />
    </div>
  );
}

function CtaEditor({ value, onSave, saving }: { value: any; onSave: (v: any) => void; saving: boolean }) {
  const [form, setForm] = useState({ badge: '', headline: '', subheadline: '', primaryButtonText: '', primaryButtonHref: '', secondaryButtonText: '', secondaryButtonHref: '', footnote: '' });
  useEffect(() => {
    if (value) setForm({ badge: value.badge || '', headline: value.headline || '', subheadline: value.subheadline || '', primaryButtonText: value.primaryButtonText || '', primaryButtonHref: value.primaryButtonHref || '', secondaryButtonText: value.secondaryButtonText || '', secondaryButtonHref: value.secondaryButtonHref || '', footnote: value.footnote || '' });
  }, [value]);
  return (
    <div className="max-w-2xl space-y-4">
      <Field label="Badge Text" value={form.badge} onChange={(v) => setForm({ ...form, badge: v })} />
      <Field label="Headline" value={form.headline} onChange={(v) => setForm({ ...form, headline: v })} />
      <Field label="Subheadline" textarea value={form.subheadline} onChange={(v) => setForm({ ...form, subheadline: v })} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Primary Button Text" value={form.primaryButtonText} onChange={(v) => setForm({ ...form, primaryButtonText: v })} />
        <Field label="Primary Button Link" value={form.primaryButtonHref} onChange={(v) => setForm({ ...form, primaryButtonHref: v })} />
        <Field label="Secondary Button Text" value={form.secondaryButtonText} onChange={(v) => setForm({ ...form, secondaryButtonText: v })} />
        <Field label="Secondary Button Link" value={form.secondaryButtonHref} onChange={(v) => setForm({ ...form, secondaryButtonHref: v })} />
      </div>
      <Field label="Footnote" value={form.footnote} onChange={(v) => setForm({ ...form, footnote: v })} />
      <SaveButton onSave={() => onSave(form)} saving={saving} />
    </div>
  );
}

function ContactEditor({ value, onSave, saving }: { value: any; onSave: (v: any) => void; saving: boolean }) {
  const [form, setForm] = useState({ title: '', subtitle: '', supportHours: '', supportEmail: '', supportPhone: '', officeAddress: '' });
  useEffect(() => {
    if (value) setForm({ title: value.title || '', subtitle: value.subtitle || '', supportHours: value.supportHours || '', supportEmail: value.supportEmail || '', supportPhone: value.supportPhone || '', officeAddress: value.officeAddress || '' });
  }, [value]);
  return (
    <div className="max-w-2xl space-y-4">
      <Field label="Page Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
      <Field label="Subtitle" textarea value={form.subtitle} onChange={(v) => setForm({ ...form, subtitle: v })} />
      <Field label="Support Email" value={form.supportEmail} onChange={(v) => setForm({ ...form, supportEmail: v })} />
      <Field label="Support Phone" value={form.supportPhone} onChange={(v) => setForm({ ...form, supportPhone: v })} />
      <Field label="Office Address" value={form.officeAddress} onChange={(v) => setForm({ ...form, officeAddress: v })} />
      <Field label="Support Hours" value={form.supportHours} onChange={(v) => setForm({ ...form, supportHours: v })} />
      <SaveButton onSave={() => onSave(form)} saving={saving} />
    </div>
  );
}

function AboutEditor({ value, onSave, saving }: { value: any; onSave: (v: any) => void; saving: boolean }) {
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (value) setForm(value); }, [value]);
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const whyChooseUs = (form.whyChooseUs || []).join('\n');
  const valuesJson = JSON.stringify(form.values || [], null, 2);
  const milestonesJson = JSON.stringify(form.milestones || [], null, 2);

  return (
    <div className="max-w-2xl space-y-4">
      <Field label="Hero Title" value={form.heroTitle || ''} onChange={(v) => set('heroTitle', v)} />
      <Field label="Hero Subtitle" textarea value={form.heroSubtitle || ''} onChange={(v) => set('heroSubtitle', v)} />
      <Field label="Mission Title" value={form.missionTitle || ''} onChange={(v) => set('missionTitle', v)} />
      <Field label="Mission Body" textarea value={form.missionBody || ''} onChange={(v) => set('missionBody', v)} />
      <Field label="Mission Secondary" textarea value={form.missionSecondary || ''} onChange={(v) => set('missionSecondary', v)} />
      <Field label="Why Choose Us (one per line)" textarea rows={4} value={whyChooseUs} onChange={(v) => setForm({ ...form, whyChooseUs: v.split('\n').filter(Boolean) })} />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Values (JSON array: title, desc)</label>
        <textarea className="input-base w-full font-mono text-xs" rows={6} value={valuesJson} onChange={(e) => { try { setForm({ ...form, values: JSON.parse(e.target.value) }); } catch { /* ignore */ } }} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Milestones (JSON array: year, label)</label>
        <textarea className="input-base w-full font-mono text-xs" rows={4} value={milestonesJson} onChange={(e) => { try { setForm({ ...form, milestones: JSON.parse(e.target.value) }); } catch { /* ignore */ } }} />
      </div>
      <Field label="CTA Title" value={form.ctaTitle || ''} onChange={(v) => set('ctaTitle', v)} />
      <Field label="CTA Subtitle" value={form.ctaSubtitle || ''} onChange={(v) => set('ctaSubtitle', v)} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="CTA Button Text" value={form.ctaButtonText || ''} onChange={(v) => set('ctaButtonText', v)} />
        <Field label="CTA Button Link" value={form.ctaButtonHref || ''} onChange={(v) => set('ctaButtonHref', v)} />
      </div>
      <SaveButton onSave={() => onSave(form)} saving={saving} />
    </div>
  );
}

function PackagesPageEditor({ value, onSave, saving }: { value: any; onSave: (v: any) => void; saving: boolean }) {
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (value) setForm(value); }, [value]);
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const faqItems = form.faqItems || [];
  const trustBadges = form.trustBadges || [];

  const updateFaq = (idx: number, patch: Partial<{ question: string; answer: string }>) =>
    setForm({ ...form, faqItems: faqItems.map((it: any, i: number) => (i === idx ? { ...it, ...patch } : it)) });
  const updateBadge = (idx: number, text: string) =>
    setForm({ ...form, trustBadges: trustBadges.map((b: any, i: number) => (i === idx ? { text } : b)) });

  return (
    <div className="max-w-2xl space-y-4">
      <Field label="Page Title" value={form.title || ''} onChange={(v) => set('title', v)} />
      <Field label="Accent Text" value={form.titleAccent || ''} onChange={(v) => set('titleAccent', v)} />
      <Field label="Subtitle" textarea value={form.subtitle || ''} onChange={(v) => set('subtitle', v)} />
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Trust Badges (one per line)</label>
        <textarea
          className="input-base w-full"
          rows={3}
          value={trustBadges.map((b: any) => b.text).join('\n')}
          onChange={(e) => setForm({ ...form, trustBadges: e.target.value.split('\n').filter(Boolean).map((text) => ({ text })) })}
        />
      </div>
      <Field label="FAQ Title" value={form.faqTitle || ''} onChange={(v) => set('faqTitle', v)} />
      <Field label="FAQ Accent" value={form.faqTitleAccent || ''} onChange={(v) => set('faqTitleAccent', v)} />
      {faqItems.map((item: any, idx: number) => (
        <div key={idx} className="space-y-2 rounded-lg border border-[var(--border-subtle)] p-3">
          <Field label={`FAQ ${idx + 1} Question`} value={item.question || ''} onChange={(v) => updateFaq(idx, { question: v })} />
          <Field label="Answer" textarea value={item.answer || ''} onChange={(v) => updateFaq(idx, { answer: v })} />
        </div>
      ))}
      <button type="button" onClick={() => setForm({ ...form, faqItems: [...faqItems, { question: '', answer: '' }] })} className="text-sm font-medium text-[var(--brand-700)]">+ Add FAQ</button>
      <Field label="Guarantee Title" value={form.guaranteeTitle || ''} onChange={(v) => set('guaranteeTitle', v)} />
      <Field label="Guarantee Text" textarea value={form.guaranteeText || ''} onChange={(v) => set('guaranteeText', v)} />
      <SaveButton onSave={() => onSave(form)} saving={saving} />
    </div>
  );
}

function Field({
  label, value, onChange, textarea, rows, compact,
}: {
  label: string; value: string; onChange: (v: string) => void; textarea?: boolean; rows?: number; compact?: boolean;
}) {
  return (
    <div className={compact ? 'flex-1' : ''}>
      <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">{label}</label>
      {textarea ? (
        <textarea
          className="input-base w-full resize-none"
          rows={rows || 4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input type="text" className="input-base w-full" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
