export type HomepageSectionId =
  | 'hero'
  | 'stats'
  | 'categories'
  | 'featuredCourses'
  | 'pricing'
  | 'testimonials'
  | 'faq'
  | 'cta';

export type HomepageSectionConfig = {
  id: HomepageSectionId;
  enabled: boolean;
};

export type HomepageCMS = {
  seo?: { title?: string; description?: string };
  sections?: HomepageSectionConfig[];
};

export type FeaturedCoursesCMS = {
  title?: string;
  titleAccent?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  limit?: number;
  source?: 'featured' | 'latest' | 'category';
  categoryId?: string;
};

export type CategoriesCMS = {
  title?: string;
  titleAccent?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  limit?: number;
};

export type PricingSectionCMS = {
  title?: string;
  subtitle?: string;
  showBillingToggle?: boolean;
  annualLabel?: string;
  lifetimeLabel?: string;
  lifetimeBadge?: string;
  guaranteeTitle?: string;
  guaranteeText?: string;
};

export type TestimonialsSectionCMS = {
  title?: string;
  titleAccent?: string;
  subtitle?: string;
  limit?: number;
  featuredOnly?: boolean;
};

export type FaqSectionCMS = {
  title?: string;
  subtitle?: string;
  items?: Array<{ question: string; answer: string }>;
};

export type HeroCMS = {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  badge?: string;
  heroImage?: string;
  accentWordCount?: number;
  showOverlay?: boolean;
  overlayCardTitle?: string;
  overlayCardDescription?: string;
  overlayProgress?: number;
  overlayProgressLabel?: string;
  overlayRating?: string;
  overlayRatingLabel?: string;
  overlayAvatarCount?: number;
};

export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionConfig[] = [
  { id: 'hero', enabled: true },
  { id: 'stats', enabled: true },
  { id: 'categories', enabled: true },
  { id: 'featuredCourses', enabled: true },
  { id: 'pricing', enabled: true },
  { id: 'testimonials', enabled: true },
  { id: 'faq', enabled: true },
  { id: 'cta', enabled: true },
];
