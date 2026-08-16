import type {
  HomepageCMS,
  FeaturedCoursesCMS,
  CategoriesCMS,
  TestimonialsSectionCMS,
} from './homepage-types';
import { DEFAULT_HOMEPAGE_SECTIONS } from './homepage-types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export type ResolvedStatItem = { label: string; value: string; suffix?: string; raw?: number };
export type PublicStats = Record<string, number>;

async function fetchJson(path: string) {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export type HomepageData = {
  cms: Record<string, any>;
  homepage: HomepageCMS;
  plans: any[];
  courses: any[];
  categories: any[];
  testimonials: any[];
  stats: PublicStats;
  statItems: ResolvedStatItem[];
};

export async function fetchHomepageData(): Promise<HomepageData> {
  const cmsRes = await fetchJson('/cms');
  const cms = cmsRes?.data || {};

  const homepage: HomepageCMS = cms.homepage || { sections: DEFAULT_HOMEPAGE_SECTIONS };
  const featuredCfg: FeaturedCoursesCMS = cms.featuredCourses || {};
  const categoriesCfg: CategoriesCMS = cms.categories || {};
  const testimonialsCfg: TestimonialsSectionCMS = cms.testimonialsSection || {};

  const courseLimit = featuredCfg.limit || 4;
  const courseParams = new URLSearchParams({ limit: String(courseLimit) });
  if (featuredCfg.source === 'featured') courseParams.set('featured', 'true');
  if (featuredCfg.source === 'category' && featuredCfg.categoryId) {
    courseParams.set('category', featuredCfg.categoryId);
  }

  const categoryLimit = categoriesCfg.limit || 8;
  const testimonialLimit = testimonialsCfg.limit || 4;
  const testimonialParams = new URLSearchParams();
  if (testimonialsCfg.featuredOnly) testimonialParams.set('featured', 'true');

  const [plansRes, coursesRes, categoriesRes, testimonialsRes, statsRes] = await Promise.all([
    fetchJson('/plans'),
    fetchJson(`/courses?${courseParams.toString()}`),
    fetchJson('/categories'),
    fetchJson(`/testimonials?${testimonialParams.toString()}`),
    fetchJson('/stats/homepage'),
  ]);

  const stats = statsRes?.data?.stats || {};
  const statItems: ResolvedStatItem[] = statsRes?.data?.items || [];

  return {
    cms,
    homepage,
    plans: plansRes?.data?.plans || plansRes?.data || [],
    courses: coursesRes?.data?.courses || [],
    categories: (categoriesRes?.data || []).slice(0, categoryLimit),
    testimonials: (testimonialsRes?.data || []).slice(0, testimonialLimit),
    stats,
    statItems,
  };
}
