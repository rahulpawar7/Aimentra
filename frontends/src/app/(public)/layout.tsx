import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { fetchCMS } from '@/lib/cms';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cms = await fetchCMS();
  const footerCms = {
    ...(cms.footer as object || {}),
    tagline: (cms.footer as any)?.tagline,
  };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <Header />
      <main className="min-w-0 flex-1 pt-[65px]">{children}</main>
      <Footer cms={footerCms} />
    </div>
  );
}
