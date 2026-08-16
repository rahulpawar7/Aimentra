import HeroSection from '@/components/sections/HeroSection';
import StatsSection from '@/components/sections/StatsSection';
import CategoriesSection from '@/components/sections/CategoriesSection';
import FeaturedCourses from '@/components/sections/FeaturedCourses';
import PricingSection from '@/components/sections/PricingSection';
import TestimonialsSection from '@/components/sections/TestimonialsSection';
import FAQSection from '@/components/sections/FAQSection';
import CTASection from '@/components/sections/CTASection';
import type { HomepageSectionConfig } from '@/lib/homepage-types';
import type { HomepageData } from '@/lib/homepage';

export default function HomePageSections({
  sections,
  data,
}: {
  sections: HomepageSectionConfig[];
  data: HomepageData;
}) {
  const { cms, plans, courses, categories, testimonials, stats, statItems } = data;

  const renderSection = (id: HomepageSectionConfig['id']) => {
    switch (id) {
      case 'hero':
        return <HeroSection cms={cms.hero} statItems={statItems} stats={stats} />;
      case 'stats':
        return <StatsSection statItems={statItems} />;
      case 'categories':
        return <CategoriesSection cms={cms.categories} categories={categories} />;
      case 'featuredCourses':
        return <FeaturedCourses cms={cms.featuredCourses} courses={courses} />;
      case 'pricing':
        return <PricingSection cms={cms.pricingSection} plans={plans} />;
      case 'testimonials':
        return <TestimonialsSection cms={cms.testimonialsSection} testimonials={testimonials} />;
      case 'faq':
        return <FAQSection cms={cms.faq} />;
      case 'cta':
        return <CTASection cms={cms.cta} />;
      default:
        return null;
    }
  };

  return (
    <>
      {sections
        .filter((s) => s.enabled)
        .map((section) => (
          <div key={section.id}>{renderSection(section.id)}</div>
        ))}
    </>
  );
}
