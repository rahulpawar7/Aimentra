import type { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Award, Users, ChevronRight } from 'lucide-react';
import { PlanCard, Plan } from '@/components/common/PlanCard';
import { fetchCMS } from '@/lib/cms';

export async function generateMetadata(): Promise<Metadata> {
  const cms = (await fetchCMS()).packagesPage;
  return {
    title: cms?.seoTitle || 'Pricing Plans — Aimentra',
    description: cms?.seoDescription || cms?.subtitle || '',
  };
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function resolveTrustBadge(badge: any, stats: Record<string, number>): string {
  if (badge.text) return badge.text;
  if (badge.metric && stats[badge.metric] !== undefined) {
    const raw = stats[badge.metric];
    const decimals = badge.decimals ?? (badge.metric === 'averageRating' ? 1 : 0);
    const formatted = decimals > 0 ? raw.toFixed(decimals) : Math.floor(raw).toLocaleString('en-IN');
    return `${formatted}${badge.suffix || ''}`;
  }
  return badge.label || '';
}

async function getPlans(): Promise<Plan[]> {
  try {
    const res = await fetch(`${API}/plans`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data?.plans || json?.data || [];
  } catch {
    return [];
  }
}

const TRUST_ICONS = [Shield, Award, Users];

export default async function PackagesPage() {
  const [plans, cmsAll, statsRes] = await Promise.all([
    getPlans(),
    fetchCMS(),
    fetch(`${API}/stats`, { next: { revalidate: 60 } }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]);
  const stats = statsRes?.data || {};
  const pageCms = cmsAll.packagesPage || {
    title: 'Choose Your',
    titleAccent: 'Growth Plan',
    subtitle: 'Invest in your business education. Start with Gold for a year of growth, or go Premium for lifetime access.',
    faqItems: [],
    trustBadges: [],
  };

  const faqs = pageCms.faqItems || [];
  const badges = pageCms.trustBadges || [];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-gradient-to-b from-[var(--bg-elevated)] to-[var(--bg-base)] py-10 text-center sm:py-14">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[200px] w-[min(100%,600px)] -translate-x-1/2 -translate-y-1/2"
          style={{ background: 'radial-gradient(ellipse, rgba(212,165,58,0.12) 0%, transparent 70%)' }}
        />
        <div className="container relative z-[1]">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--brand-700)' }}>Packages</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: '900', marginBottom: '16px' }}>
            {pageCms.title} {pageCms.titleAccent ? <span className="gradient-text">{pageCms.titleAccent}</span> : null}
          </h1>
          {pageCms.subtitle ? (
            <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
              {pageCms.subtitle}
            </p>
          ) : null}
          {badges.length > 0 ? (
            <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginTop: '32px', flexWrap: 'wrap' }}>
              {badges.map((badge: any, i: number) => {
                const Icon = TRUST_ICONS[i % TRUST_ICONS.length];
                const text = resolveTrustBadge(badge, stats);
                if (!text) return null;
                return (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--brand-600)' }}><Icon size={16} /></span> {text}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="container overflow-x-hidden py-10 sm:py-14">
        {plans.length === 0 ? (
          <p className="py-12 text-center text-[var(--text-secondary)]">No plans are available right now. Please check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {plans.map((plan: any, idx: number) => (
              <PlanCard key={plan._id || plan.id || idx} plan={plan} featured={plan.featured} />
            ))}
          </div>
        )}

        {faqs.length > 0 && pageCms.faqTitle ? (
          <div style={{ marginTop: '80px', maxWidth: '700px', margin: '80px auto 0' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', textAlign: 'center', marginBottom: '40px' }}>
              {pageCms.faqTitle} {pageCms.faqTitleAccent ? <span className="gradient-text">{pageCms.faqTitleAccent}</span> : null}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {faqs.map((faq: { question: string; answer: string }, i: number) => (
                <div key={i} className="glass-card" style={{ padding: '20px 24px' }}>
                  <h4 style={{ fontWeight: '700', marginBottom: '10px', fontSize: '0.95rem' }}>{faq.question}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {pageCms.guaranteeTitle ? (
          <div className="mt-12 rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--gradient-brand-subtle)] p-6 text-center sm:mt-16 sm:p-12">
            <Shield size={48} color="var(--success)" className="mx-auto mb-4 block" />
            <h3 className="mb-3 text-xl font-extrabold sm:text-2xl">{pageCms.guaranteeTitle}</h3>
            {pageCms.guaranteeText ? <p className="mx-auto max-w-lg text-[var(--text-secondary)]">{pageCms.guaranteeText}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
