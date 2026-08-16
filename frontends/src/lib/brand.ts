/** Central brand constants — Aimentra */
export const BRAND = {
  name: 'Aimentra',
  nameUpper: 'AIMENTRA',
  monogram: 'Ai',
  slug: 'aimentra',
  domain: 'aimentra.com',
  url: 'https://aimentra.com',
  tagline: 'Learn Smarter with AI-Powered Courses',
  seoTitle: 'Aimentra — Learn Smarter with AI-Powered Courses',
  seoDescription:
    'Aimentra is an intelligent learning platform helping students and professionals master skills with AI-guided courses, personalized progress, and verified certificates.',
  supportEmail: 'support@aimentra.com',
  noreplyEmail: 'noreply@aimentra.com',
  adminEmail: 'admin@aimentra.com',
} as const;

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || BRAND.name;
