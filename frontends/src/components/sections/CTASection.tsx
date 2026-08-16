import Link from 'next/link';
import { Zap, ArrowRight } from 'lucide-react';

type CtaCMS = {
  badge?: string;
  headline?: string;
  subheadline?: string;
  primaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonText?: string;
  secondaryButtonHref?: string;
  footnote?: string;
};

export default function CTASection({ cms }: { cms?: CtaCMS }) {
  if (!cms?.headline) return null;

  return (
    <section className="surface-dark section relative overflow-hidden">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[200px] w-[min(100%,600px)] -translate-x-1/2 -translate-y-1/2"
        style={{ background: 'radial-gradient(ellipse, rgba(212,165,58,0.18) 0%, transparent 70%)' }}
      />

      <div className="container relative z-[1] text-center">
        {cms.badge ? (
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--brand-400)]/40 bg-[var(--brand-400)]/10 px-4 py-2 sm:mb-6">
            <Zap size={14} color="var(--brand-400)" />
            <span className="text-sm font-semibold text-[var(--brand-300)]">{cms.badge}</span>
          </div>
        ) : null}

        <h2 className="mb-4 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">{cms.headline}</h2>

        {cms.subheadline ? (
          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-muted-on-dark sm:mb-10 sm:text-lg">{cms.subheadline}</p>
        ) : null}

        {(cms.primaryButtonText || cms.secondaryButtonText) && (
          <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
            {cms.primaryButtonText && cms.primaryButtonHref ? (
              <Link href={cms.primaryButtonHref} className="btn-brand px-6 py-3 text-base sm:px-8 sm:py-4">
                <Zap size={20} /> {cms.primaryButtonText}
              </Link>
            ) : null}
            {cms.secondaryButtonText && cms.secondaryButtonHref ? (
              <Link href={cms.secondaryButtonHref} className="btn-outline border-white/25 px-6 py-3 text-base text-white hover:bg-white/10 sm:px-8 sm:py-4">
                {cms.secondaryButtonText} <ArrowRight size={20} />
              </Link>
            ) : null}
          </div>
        )}

        {cms.footnote ? <p className="mt-6 text-sm text-muted-on-dark">{cms.footnote}</p> : null}
      </div>
    </section>
  );
}
