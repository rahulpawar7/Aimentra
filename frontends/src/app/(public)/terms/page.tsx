import { fetchCMSBlock } from '@/lib/cms';

export const metadata = { title: 'Terms & Conditions — Aimentra' };

export default async function TermsPage() {
  const cms = await fetchCMSBlock('terms');
  const title = cms?.title || 'Terms & Conditions';
  const lastUpdated = cms?.lastUpdated || '';
  const body = cms?.body || '<p>Terms content is being updated.</p>';

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] py-10 text-center sm:py-14">
        <div className="container mx-auto max-w-2xl px-4">
          <h1 className="mb-2 text-3xl font-extrabold text-[var(--text-primary)] sm:text-4xl">{title}</h1>
          {lastUpdated && <p className="text-sm text-[var(--text-muted)]">Last updated: {lastUpdated}</p>}
        </div>
      </div>
      <div className="container mx-auto max-w-3xl px-4 py-12 sm:py-16 prose prose-neutral max-w-none cms-content" dangerouslySetInnerHTML={{ __html: body }} />
    </div>
  );
}
