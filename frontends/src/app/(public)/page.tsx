import type { Metadata } from 'next';
import { fetchHomepageData } from '@/lib/homepage';
import { DEFAULT_HOMEPAGE_SECTIONS } from '@/lib/homepage-types';
import HomePageSections from '@/components/sections/HomePageSections';

export async function generateMetadata(): Promise<Metadata> {
  const { homepage } = await fetchHomepageData();
  return {
    title: homepage.seo?.title || 'Aimentra',
    description: homepage.seo?.description || '',
  };
}

export default async function HomePage() {
  const data = await fetchHomepageData();
  const sections = data.homepage.sections?.length ? data.homepage.sections : DEFAULT_HOMEPAGE_SECTIONS;

  return <HomePageSections sections={sections} data={data} />;
}
