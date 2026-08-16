import mongoose from 'mongoose';
import User from '../models/User';
import Category from '../models/Category';
import Plan from '../models/Plan';
import Course from '../models/Course';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { ensureDevAccounts } from './ensure-dev-accounts';

dotenv.config();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aimentra';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');

    // 1. Ensure default admin + demo student (handles legacy email migrations)
    const { admin: adminUser } = await ensureDevAccounts();
    const adminEmail = adminUser.email;

    // 2. Create default categories
    const categoryNames = ['Business', 'Marketing', 'Finance', 'Sales', 'HR Management', 'Mindset', 'Entrepreneurship'];
    for (const name of categoryNames) {
      const slug = slugify(name);
      const existing = await Category.findOne({ slug });
      if (!existing) {
        await new Category({ name, slug, description: `${name} training courses`, active: true }).save();
        console.log(`✅ Created category: ${name}`);
      }
    }

    // 3. Create default plans
    const plansData = [
      {
        name: 'Free',
        slug: 'free',
        description: 'Get started with preview access to our courses',
        price: 0,
        compareAtPrice: 0,
        durationDays: 30,
        lifetime: false,
        features: ['course.view', 'video.play_preview'],
        highlights: ['Preview access', '30-day trial', 'Limited content'],
        active: true,
        sortOrder: 1,
      },
      {
        name: 'Gold',
        slug: 'gold',
        description: 'Complete access to all courses for 1 full year',
        price: 9999,
        compareAtPrice: 19999,
        durationDays: 365,
        lifetime: false,
        features: ['course.view', 'course.access', 'video.play', 'pdf.access', 'certificate.generate', 'community.access'],
        highlights: ['Full course access', '1 Year validity', 'Certificate', 'Community access', 'PDF downloads'],
        active: true,
        sortOrder: 2,
      },
      {
        name: 'Premium',
        slug: 'premium',
        description: 'Lifetime access with all premium features and future updates',
        price: 19999,
        compareAtPrice: 39999,
        lifetime: true,
        features: ['course.view', 'course.access', 'video.play', 'pdf.access', 'certificate.generate', 'community.access', 'support.access', 'futureUpdates.access', 'bonus.access', 'video.download'],
        highlights: ['Lifetime access', 'All courses', 'VIP community', 'Priority support', 'Future updates', 'Downloadable content', 'Premium bonuses'],
        active: true,
        sortOrder: 3,
      },
    ];

    for (const p of plansData) {
      const existing = await Plan.findOne({ slug: p.slug });
      if (!existing) {
        await new Plan({
          ...p,
          status: 'active',
          allCourses: p.slug !== 'free',
          billingType: p.lifetime ? 'lifetime' : 'one_time',
        }).save();
        console.log(`✅ Created plan: ${p.name}`);
      } else {
        existing.allCourses = p.slug !== 'free';
        existing.status = 'active';
        await existing.save();
        console.log(`ℹ️ Updated plan unlock flags: ${p.name}`);
      }
    }

    // 4. Create sample courses
    const sampleCourses = [
      {
        title: 'Secrets of 10X Marketing',
        shortDescription: 'Master the art of marketing to 10x your customer acquisition and revenue.',
        fullDescription: 'Comprehensive digital marketing course covering brand strategy, social media, paid ads, sales funnels, and retention.',
        thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
        price: 9999,
        compareAtPrice: 19999,
        status: 'published',
        difficulty: 'all_levels',
        language: 'english',
        totalDuration: 1200,
        lessonCount: 48,
        learnerCount: 12400,
        rating: 4.9,
      },
      {
        title: 'Sales Mastery Bootcamp',
        shortDescription: 'Learn proven sales techniques that close deals and build long-term client relationships.',
        fullDescription: 'Master consultative selling, objection handling, closing strategies, and sales team management.',
        thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
        price: 9999,
        compareAtPrice: 19999,
        status: 'published',
        difficulty: 'beginner',
        language: 'english',
        totalDuration: 900,
        lessonCount: 36,
        learnerCount: 8900,
        rating: 4.8,
      },
      {
        title: 'Finance for Entrepreneurs',
        shortDescription: 'Understand business finance, cash flow management, and working capital optimization.',
        fullDescription: 'Essential financial management for Indian SMEs: P&L analysis, balance sheets, taxation basics, working capital.',
        thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
        price: 9999,
        compareAtPrice: 19999,
        status: 'published',
        difficulty: 'intermediate',
        language: 'english',
        totalDuration: 840,
        lessonCount: 32,
        learnerCount: 6700,
        rating: 4.9,
      },
    ];

    const allCategories = await Category.find();
    for (const c of sampleCourses) {
      const slug = slugify(c.title);
      const existing = await Course.findOne({ slug });
      if (!existing) {
        const cat = allCategories[Math.floor(Math.random() * allCategories.length)];
        await new Course({
          ...c,
          slug,
          category: cat._id,
          instructor: adminUser?._id,
          instructorName: adminUser?.name || 'Super Admin',
        }).save();
        console.log(`✅ Created course: ${c.title}`);
      }
    }

    // 5. Sample curriculum (modules + lessons) for player testing.
    // Uses real, high-quality, publicly hosted MP4s (Blender Foundation open
    // movies + Google ad-campaign clips) so every lesson is genuinely playable,
    // not a broken placeholder link.
    const { default: CourseModule } = await import('../models/CourseModule');
    const { default: Lesson } = await import('../models/Lesson');

    // NOTE: Google's old gtv-videos-bucket sample clips now return 403 (bucket
    // access was locked down), so lessons must use these verified-reachable,
    // real, professionally produced open-source films/clips instead.
    const VIDEO_POOL = [
      { url: 'https://media.w3.org/2010/05/bunny/movie.mp4', duration: 596 },
      { url: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4', duration: 52 },
      { url: 'https://vjs.zencdn.net/v/oceans.mp4', duration: 46 },
      { url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4', duration: 10 },
      { url: 'https://test-videos.co.uk/vids/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4', duration: 10 },
      { url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4', duration: 10 },
      { url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', duration: 10 },
      { url: 'https://media.w3.org/2010/05/video/movie_300.mp4', duration: 30 },
    ];

    const CURRICULUM: Record<string, { modules: Array<{ title: string; lessons: string[] }> }> = {
      'Secrets of 10X Marketing': {
        modules: [
          { title: 'Marketing Foundations', lessons: ['Welcome & Course Overview', 'The Marketing Pyramid Explained', 'Understanding Your Customer Avatar', 'Positioning & Brand Story'] },
          { title: 'Growth Channels & Execution', lessons: ['Social Media Growth Playbook', 'High-Converting Paid Ad Funnels', 'Email & Retention Marketing', '90-Day Marketing Action Plan'] },
        ],
      },
      'Sales Mastery Bootcamp': {
        modules: [
          { title: 'Sales Fundamentals', lessons: ['Welcome & Course Overview', 'The Consultative Selling Framework', 'Building Instant Rapport', 'Qualifying the Right Prospects'] },
          { title: 'Closing & Scaling', lessons: ['Handling Objections With Confidence', 'Proven Closing Techniques', 'Building a High-Performing Sales Team', 'Your 90-Day Sales Growth Plan'] },
        ],
      },
      'Finance for Entrepreneurs': {
        modules: [
          { title: 'Financial Foundations', lessons: ['Welcome & Course Overview', 'Reading a P&L Statement', 'Understanding Your Balance Sheet', 'Cash Flow Management Essentials'] },
          { title: 'Growth & Optimization', lessons: ['Working Capital Optimization', 'Taxation Basics for Indian SMEs', 'Pricing for Profitability', 'Building Your Financial Dashboard'] },
        ],
      },
    };

    const courses = await Course.find({ status: 'published' });
    for (const course of courses) {
      const plan = CURRICULUM[course.title];
      if (!plan) continue;

      // Full refresh so every run leaves a clean, consistent, fully-playable curriculum.
      await Lesson.deleteMany({ courseId: course._id });
      await CourseModule.deleteMany({ courseId: course._id });

      let sortOrder = 1;
      let totalDuration = 0;
      let lessonCount = 0;
      let videoIdx = 0;

      for (let mIdx = 0; mIdx < plan.modules.length; mIdx++) {
        const moduleDef = plan.modules[mIdx];
        const mod = await CourseModule.create({
          courseId: course._id,
          title: moduleDef.title,
          sortOrder: mIdx + 1,
          description: `${moduleDef.title} — module ${mIdx + 1} of ${plan.modules.length}`,
        });

        for (let lIdx = 0; lIdx < moduleDef.lessons.length; lIdx++) {
          const video = VIDEO_POOL[videoIdx % VIDEO_POOL.length];
          videoIdx++;
          const isFirstLesson = mIdx === 0 && lIdx === 0;
          await Lesson.create({
            courseId: course._id,
            moduleId: mod._id,
            title: moduleDef.lessons[lIdx],
            type: 'video',
            sortOrder: sortOrder++,
            status: 'published',
            isPreview: isFirstLesson,
            isFree: isFirstLesson,
            videoUrl: video.url,
            videoDuration: video.duration,
            videoThumbnail: course.thumbnail,
            videoPoster: course.thumbnail,
          });
          totalDuration += video.duration;
          lessonCount++;
        }
      }

      // Wrap-up text lesson
      await Lesson.create({
        courseId: course._id,
        moduleId: (await CourseModule.findOne({ courseId: course._id }).sort({ sortOrder: -1 }))!._id,
        title: 'Key Takeaways & Next Steps',
        type: 'text',
        sortOrder: sortOrder++,
        status: 'published',
        content: '<p>Congratulations on completing this module! Summarize what you learned and apply it this week.</p>',
      });
      lessonCount++;

      course.moduleCount = plan.modules.length;
      course.lessonCount = lessonCount;
      course.totalDuration = Math.round(totalDuration / 60); // minutes, matches Course schema
      await course.save();

      console.log(`✅ Curriculum refreshed for ${course.title}: ${plan.modules.length} modules, ${lessonCount} lessons`);
    }

    // Ensure paid plans unlock all published courses
    const publishedIds = courses.map((c) => c._id);
    await Plan.updateMany(
      { slug: { $in: ['gold', 'premium'] } },
      { $set: { allCourses: true, courses: publishedIds, status: 'active' } }
    );

    // 6. Blog posts
    const { default: Blog } = await import('../models/Blog');
    const blogPosts = [
      {
        title: 'The 5 Marketing Frameworks Every Founder Should Know',
        excerpt: 'Cut through the noise — these are the frameworks our most successful students use to plan campaigns that actually convert.',
        content: '<p>Marketing is not about shouting louder — it is about speaking to the right person, with the right message, at the right time.</p><p>In this guide, we break down five battle-tested frameworks used by Aimentra alumni to grow their businesses 10X.</p>',
        category: 'Marketing',
        coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
        tags: ['marketing', 'growth', 'frameworks'],
      },
      {
        title: 'How to Build a Sales Process That Scales',
        excerpt: 'A repeatable sales process is the difference between hustling for every deal and building a predictable growth engine.',
        content: '<p>Sales is a system, not a talent. Learn how to document, train, and optimize your sales pipeline.</p>',
        category: 'Sales',
        coverImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
        tags: ['sales', 'process', 'scaling'],
      },
      {
        title: 'Cash Flow Basics for First-Time Founders',
        excerpt: 'Understanding working capital early can save your business from the most common cause of failure — running out of cash.',
        content: '<p>Cash flow management is the #1 skill every entrepreneur must master. Here is a practical primer.</p>',
        category: 'Finance',
        coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
        tags: ['finance', 'cashflow', 'startup'],
      },
    ];
    for (const post of blogPosts) {
      const slug = slugify(post.title);
      if (!(await Blog.findOne({ slug }))) {
        await Blog.create({
          ...post,
          slug,
          author: adminUser?._id,
          authorName: adminUser?.name || 'Aimentra Team',
          status: 'published',
          publishedAt: new Date(),
          readTime: 5,
        });
        console.log(`✅ Created blog post: ${post.title}`);
      }
    }

    // 7. Events
    const { default: Event } = await import('../models/Event');
    const sampleEvents = [
      {
        title: 'Business Growth Masterclass',
        description: 'Join our live masterclass on scaling your business with proven growth frameworks.',
        date: new Date('2026-08-22T12:30:00Z'),
        endDate: new Date('2026-08-22T14:30:00Z'),
        timezone: 'Asia/Kolkata',
        isOnline: true,
        meetingUrl: 'https://zoom.us/j/example',
        capacity: 500,
        status: 'upcoming' as const,
        price: 0,
        tags: ['masterclass', 'growth'],
      },
      {
        title: 'Sales Mastery Workshop',
        description: 'Hands-on workshop on consultative selling and closing techniques.',
        date: new Date('2026-09-05T05:30:00Z'),
        endDate: new Date('2026-09-05T08:30:00Z'),
        timezone: 'Asia/Kolkata',
        isOnline: true,
        meetingUrl: 'https://zoom.us/j/example2',
        capacity: 320,
        status: 'upcoming' as const,
        price: 0,
        tags: ['sales', 'workshop'],
      },
      {
        title: 'Founders Meetup — Indore Chapter',
        description: 'In-person networking and learning session for Indore entrepreneurs.',
        date: new Date('2026-09-19T11:30:00Z'),
        endDate: new Date('2026-09-19T14:30:00Z'),
        timezone: 'Asia/Kolkata',
        venue: 'Indore, Madhya Pradesh',
        isOnline: false,
        capacity: 80,
        status: 'upcoming' as const,
        price: 0,
        tags: ['meetup', 'networking'],
      },
    ];
    for (const evt of sampleEvents) {
      const slug = slugify(evt.title);
      if (!(await Event.findOne({ slug }))) {
        await Event.create({ ...evt, slug, requiresRegistration: true });
        console.log(`✅ Created event: ${evt.title}`);
      }
    }

    // 8. Testimonials
    const { default: Testimonial } = await import('../models/Testimonial');
    const sampleTestimonials = [
      { name: 'Rajesh Kumar', designation: 'Founder', company: 'TechStart India', content: 'Aimentra transformed how I approach marketing. My revenue grew 3X in 6 months.', rating: 5, featured: true, sortOrder: 1 },
      { name: 'Priya Sharma', designation: 'CEO', company: 'GrowthLabs', content: 'The sales bootcamp gave me a repeatable process. Best investment I made for my business.', rating: 5, featured: true, sortOrder: 2 },
      { name: 'Amit Patel', designation: 'Entrepreneur', company: 'Patel Enterprises', content: 'Finally understood cash flow management. Saved my business from a critical shortage.', rating: 5, featured: true, sortOrder: 3 },
      { name: 'Sneha Reddy', designation: 'Marketing Head', company: 'BrandCraft', content: 'Practical, actionable content. No fluff — exactly what busy founders need.', rating: 5, featured: false, sortOrder: 4 },
    ];
    for (const t of sampleTestimonials) {
      if (!(await Testimonial.findOne({ name: t.name, content: t.content }))) {
        await Testimonial.create({ ...t, approved: true, source: 'manual' });
        console.log(`✅ Created testimonial from ${t.name}`);
      }
    }

    // 9. Demo population — students, instructors, orders, enrollments
    const { seedDemoPopulation } = await import('./seed-demo-data');
    await seedDemoPopulation(adminUser?._id);

    // Ensure all published courses have playable curriculum (including demo courses)
    const { ensureAllCoursesHaveCurriculum } = await import('../services/curriculum.service');
    const curriculumCreated = await ensureAllCoursesHaveCurriculum();
    if (curriculumCreated > 0) {
      console.log(`✅ Added curriculum to ${curriculumCreated} courses`);
    }

    // 10. CMS — upsert all default blocks
    const { default: CMSContent } = await import('../models/CMSContent');
    const { DEFAULT_BLOCKS } = await import('../config/cms-defaults');
    for (const [key, jsonValue] of Object.entries(DEFAULT_BLOCKS)) {
      await CMSContent.findOneAndUpdate({ key }, { jsonValue }, { upsert: true });
    }
    console.log(`✅ Upserted ${Object.keys(DEFAULT_BLOCKS).length} CMS blocks`);

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seed();
