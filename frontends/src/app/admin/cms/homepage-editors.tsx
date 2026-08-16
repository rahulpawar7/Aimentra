'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import type { HomepageSectionConfig, HomepageSectionId } from '@/lib/homepage-types';
import { DEFAULT_HOMEPAGE_SECTIONS } from '@/lib/homepage-types';

const SECTION_LABELS: Record<HomepageSectionId, string> = {
  hero: 'Hero Banner',
  stats: 'Stats Bar',
  categories: 'Categories Grid',
  featuredCourses: 'Featured Courses',
  pricing: 'Pricing Plans',
  testimonials: 'Testimonials',
  faq: 'FAQ',
  cta: 'Call to Action',
};

export function HomepageEditor({ value, onSave, saving }: { value: any; onSave: (v: any) => void; saving: boolean }) {
  const [seo, setSeo] = useState({ title: '', description: '' });
  const [sections, setSections] = useState<HomepageSectionConfig[]>(DEFAULT_HOMEPAGE_SECTIONS);

  useEffect(() => {
    if (value) {
      setSeo({ title: value.seo?.title || '', description: value.seo?.description || '' });
      setSections(value.sections?.length ? value.sections : DEFAULT_HOMEPAGE_SECTIONS);
    }
  }, [value]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setSections(next);
  };

  const toggle = (idx: number) => {
    setSections(sections.map((s, i) => (i === idx ? { ...s, enabled: !s.enabled } : s)));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h3 className="mb-3 font-semibold text-[var(--text-primary)]">Page SEO</h3>
        <div className="space-y-3">
          <Field label="Page Title" value={seo.title} onChange={(v) => setSeo({ ...seo, title: v })} />
          <Field label="Meta Description" textarea value={seo.description} onChange={(v) => setSeo({ ...seo, description: v })} />
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-semibold text-[var(--text-primary)]">Section Order & Visibility</h3>
        <p className="mb-3 text-sm text-[var(--text-muted)]">Reorder sections and toggle visibility on the homepage.</p>
        <div className="space-y-2">
          {sections.map((section, idx) => (
            <div key={section.id} className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] p-3">
              <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} className="rounded p-0.5 hover:bg-[var(--bg-elevated)] disabled:opacity-30">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === sections.length - 1} className="rounded p-0.5 hover:bg-[var(--bg-elevated)] disabled:opacity-30">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{SECTION_LABELS[section.id] || section.id}</span>
              <button type="button" onClick={() => toggle(idx)} className={`rounded-lg px-2 py-1 text-xs font-medium ${section.enabled ? 'bg-green-500/10 text-green-700' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
                {section.enabled ? <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> Visible</span> : <span className="inline-flex items-center gap-1"><EyeOff className="h-3 w-3" /> Hidden</span>}
              </button>
            </div>
          ))}
        </div>
      </div>

      <SaveButton onSave={() => onSave({ seo, sections })} saving={saving} />
    </div>
  );
}

export function SectionHeaderEditor({
  value,
  onSave,
  saving,
  fields,
}: {
  value: any;
  onSave: (v: any) => void;
  saving: boolean;
  fields: Array<'title' | 'titleAccent' | 'subtitle' | 'ctaText' | 'ctaHref' | 'limit' | 'source' | 'categoryId' | 'featuredOnly' | 'showBillingToggle' | 'annualLabel' | 'lifetimeLabel' | 'lifetimeBadge' | 'guaranteeTitle' | 'guaranteeText'>;
}) {
  const [form, setForm] = useState<any>({});
  useEffect(() => { if (value) setForm(value); }, [value]);
  const set = (k: string, v: string | number | boolean) => setForm({ ...form, [k]: v });

  return (
    <div className="max-w-2xl space-y-4">
      {fields.includes('title') && <Field label="Section Title" value={form.title || ''} onChange={(v) => set('title', v)} />}
      {fields.includes('titleAccent') && <Field label="Accent Text (highlighted)" value={form.titleAccent || ''} onChange={(v) => set('titleAccent', v)} />}
      {fields.includes('subtitle') && <Field label="Subtitle" textarea value={form.subtitle || ''} onChange={(v) => set('subtitle', v)} />}
      {fields.includes('ctaText') && <Field label="CTA Button Text" value={form.ctaText || ''} onChange={(v) => set('ctaText', v)} />}
      {fields.includes('ctaHref') && <Field label="CTA Button Link" value={form.ctaHref || ''} onChange={(v) => set('ctaHref', v)} />}
      {fields.includes('limit') && <Field label="Number of Items to Show" value={String(form.limit || 4)} onChange={(v) => set('limit', Number(v) || 4)} />}
      {fields.includes('source') && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">Course Source</label>
          <select className="input-base w-full" value={form.source || 'featured'} onChange={(e) => set('source', e.target.value)}>
            <option value="featured">Featured courses only</option>
            <option value="latest">Latest published courses</option>
            <option value="category">By category</option>
          </select>
        </div>
      )}
      {fields.includes('categoryId') && form.source === 'category' && (
        <Field label="Category ID (from Categories admin)" value={form.categoryId || ''} onChange={(v) => set('categoryId', v)} />
      )}
      {fields.includes('featuredOnly') && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.featuredOnly} onChange={(e) => set('featuredOnly', e.target.checked)} />
          Show featured testimonials only
        </label>
      )}
      {fields.includes('showBillingToggle') && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.showBillingToggle !== false} onChange={(e) => set('showBillingToggle', e.target.checked)} />
          Show billing cycle toggle
        </label>
      )}
      {fields.includes('annualLabel') && <Field label="Annual Tab Label" value={form.annualLabel || ''} onChange={(v) => set('annualLabel', v)} />}
      {fields.includes('lifetimeLabel') && <Field label="Lifetime Tab Label" value={form.lifetimeLabel || ''} onChange={(v) => set('lifetimeLabel', v)} />}
      {fields.includes('lifetimeBadge') && <Field label="Lifetime Tab Badge" value={form.lifetimeBadge || ''} onChange={(v) => set('lifetimeBadge', v)} />}
      {fields.includes('guaranteeTitle') && <Field label="Guarantee Title" value={form.guaranteeTitle || ''} onChange={(v) => set('guaranteeTitle', v)} />}
      {fields.includes('guaranteeText') && <Field label="Guarantee Text" textarea value={form.guaranteeText || ''} onChange={(v) => set('guaranteeText', v)} />}
      <SaveButton onSave={() => onSave(form)} saving={saving} />
    </div>
  );
}

export function HeroOverlayEditor({ value, onSave, saving }: { value: any; onSave: (v: any) => void; saving: boolean }) {
  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (value) setForm(value);
  }, [value]);
  const set = (k: string, v: string | number | boolean) => setForm({ ...form, [k]: v });

  return (
    <div className="max-w-2xl space-y-4">
      <Field label="Badge Text" value={form.badge || ''} onChange={(v) => set('badge', v)} />
      <Field label="Headline" value={form.headline || ''} onChange={(v) => set('headline', v)} />
      <Field label="Subheadline" textarea value={form.subheadline || ''} onChange={(v) => set('subheadline', v)} />
      <Field label="Accent Word Count (highlight last N words)" value={String(form.accentWordCount ?? 2)} onChange={(v) => set('accentWordCount', Number(v) || 2)} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Primary CTA Text" value={form.ctaText || ''} onChange={(v) => set('ctaText', v)} />
        <Field label="Primary CTA Link" value={form.ctaHref || ''} onChange={(v) => set('ctaHref', v)} />
        <Field label="Secondary CTA Text" value={form.secondaryCtaText || ''} onChange={(v) => set('secondaryCtaText', v)} />
        <Field label="Secondary CTA Link" value={form.secondaryCtaHref || ''} onChange={(v) => set('secondaryCtaHref', v)} />
      </div>
      <Field label="Hero Background Image URL" value={form.heroImage || ''} onChange={(v) => set('heroImage', v)} />
      <hr className="border-[var(--border-subtle)]" />
      <h3 className="font-semibold text-[var(--text-primary)]">Hero Overlay Card</h3>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.showOverlay !== false} onChange={(e) => set('showOverlay', e.target.checked)} />
        Show overlay cards on desktop
      </label>
      <Field label="Card Title" value={form.overlayCardTitle || ''} onChange={(v) => set('overlayCardTitle', v)} />
      <Field label="Card Description" textarea value={form.overlayCardDescription || ''} onChange={(v) => set('overlayCardDescription', v)} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Progress %" value={String(form.overlayProgress ?? 0)} onChange={(v) => set('overlayProgress', Number(v) || 0)} />
        <Field label="Progress Label" value={form.overlayProgressLabel || ''} onChange={(v) => set('overlayProgressLabel', v)} />
        <Field label="Rating Value" value={form.overlayRating || ''} onChange={(v) => set('overlayRating', v)} />
        <Field label="Rating Label" value={form.overlayRatingLabel || ''} onChange={(v) => set('overlayRatingLabel', v)} />
        <Field label="Avatar Count" value={String(form.overlayAvatarCount ?? 4)} onChange={(v) => set('overlayAvatarCount', Number(v) || 0)} />
      </div>
      <SaveButton onSave={() => onSave(form)} saving={saving} />
    </div>
  );
}

function SaveButton({ onSave, saving }: { onSave: () => void; saving: boolean }) {
  return (
    <button type="button" onClick={onSave} disabled={saving} className="btn-brand mt-2 flex items-center gap-2 px-5 py-2 text-sm">
      {saving ? 'Saving...' : 'Save Changes'}
    </button>
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
        <textarea className="input-base w-full resize-none" rows={rows || 4} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type="text" className="input-base w-full" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}
