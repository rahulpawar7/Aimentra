import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { fetchCMSBlock } from '@/lib/cms';

export const metadata = { title: 'About Us — Aimentra' };

export default async function AboutPage() {
  const cms = await fetchCMSBlock('about');

  const heroTitle = cms?.heroTitle || 'Transforming Businesses, One Founder at a Time';
  const heroSubtitle = cms?.heroSubtitle || '';
  const missionTitle = cms?.missionTitle || 'Our Mission';
  const missionBody = cms?.missionBody || '';
  const missionSecondary = cms?.missionSecondary || '';
  const whyChooseUs: string[] = cms?.whyChooseUs || [];
  const values: { title: string; desc: string }[] = cms?.values || [];
  const milestones: { year: string; label: string }[] = cms?.milestones || [];
  const ctaTitle = cms?.ctaTitle || 'Ready to start your transformation?';
  const ctaSubtitle = cms?.ctaSubtitle || '';
  const ctaButtonText = cms?.ctaButtonText || 'Explore Courses';
  const ctaButtonHref = cms?.ctaButtonHref || '/courses';

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="surface-dark relative overflow-hidden py-14 text-center sm:py-20">
        <div className="pointer-events-none absolute inset-0" style={{ background: 'var(--gradient-glow)' }} />
        <div className="container relative z-10 mx-auto max-w-3xl px-4">
          <h1 className="mb-4 text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">{heroTitle}</h1>
          {heroSubtitle && <p className="text-base text-muted-on-dark sm:text-lg">{heroSubtitle}</p>}
        </div>
      </div>

      {(missionBody || missionSecondary) && (
        <section className="container mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            <div>
              <h2 className="mb-4 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">{missionTitle}</h2>
              {missionBody && <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">{missionBody}</p>}
              {missionSecondary && <p className="leading-relaxed text-[var(--text-secondary)]">{missionSecondary}</p>}
            </div>
            {whyChooseUs.length > 0 && (
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)] sm:p-8">
                <h3 className="mb-4 text-lg font-bold text-[var(--text-primary)]">Why learners choose us</h3>
                <ul className="space-y-3">
                  {whyChooseUs.map((item: string) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {values.length > 0 && (
        <section className="bg-[var(--bg-surface)] py-12 sm:py-16">
          <div className="container mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold text-[var(--text-primary)] sm:mb-12 sm:text-3xl">What We Stand For</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((v) => (
                <div key={v.title} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-card)]">
                  <h3 className="mb-2 text-sm font-bold text-[var(--text-primary)]">{v.title}</h3>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {milestones.length > 0 && (
        <section className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
          <h2 className="mb-8 text-center text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">Our Journey</h2>
          <div className="space-y-6 border-l-2 border-[var(--border-subtle)] pl-6">
            {milestones.map((m) => (
              <div key={m.year} className="relative">
                <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-[var(--bg-base)] bg-[var(--brand-500)]" />
                <p className="text-sm font-bold text-[var(--brand-700)]">{m.year}</p>
                <p className="text-[var(--text-secondary)]">{m.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="surface-dark py-12 text-center sm:py-16">
        <div className="container mx-auto max-w-2xl px-4">
          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">{ctaTitle}</h2>
          {ctaSubtitle && <p className="mb-6 text-muted-on-dark">{ctaSubtitle}</p>}
          <Link href={ctaButtonHref} className="btn-brand inline-flex">{ctaButtonText}</Link>
        </div>
      </section>
    </div>
  );
}
