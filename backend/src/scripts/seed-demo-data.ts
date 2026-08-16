import bcrypt from 'bcryptjs';
import User from '../models/User';
import Category from '../models/Category';
import Course from '../models/Course';
import Plan from '../models/Plan';
import Order from '../models/Order';
import Entitlement from '../models/Entitlement';
import Progress from '../models/Progress';
import Certificate from '../models/Certificate';
import Lesson from '../models/Lesson';
import { syncDenormalizedCounts } from '../services/stats.service';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

const FIRST_NAMES = ['Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Karan', 'Divya', 'Rohan', 'Meera', 'Arjun', 'Kavya', 'Sanjay', 'Neha', 'Deepak'];
const LAST_NAMES = ['Sharma', 'Patel', 'Kumar', 'Reddy', 'Singh', 'Joshi', 'Mehta', 'Gupta', 'Verma', 'Nair', 'Iyer', 'Malhotra', 'Chopra', 'Desai', 'Rao'];
const CITIES = ['Indore', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Ahmedabad', 'Hyderabad', 'Jaipur', 'Chennai', 'Lucknow'];

const EXTRA_COURSES = [
  { title: 'HR Management Excellence', category: 'HR Management', featured: true, rating: 4.7, reviewCount: 142, difficulty: 'intermediate' },
  { title: 'Mindset Mastery for Entrepreneurs', category: 'Mindset', featured: true, rating: 4.8, reviewCount: 198, difficulty: 'all_levels' },
  { title: 'Digital Marketing Fundamentals', category: 'Marketing', featured: false, rating: 4.6, reviewCount: 87, difficulty: 'beginner' },
  { title: 'Startup Fundraising Blueprint', category: 'Entrepreneurship', featured: true, rating: 4.9, reviewCount: 76, difficulty: 'advanced' },
  { title: 'Leadership & Team Building', category: 'Business', featured: false, rating: 4.7, reviewCount: 64, difficulty: 'intermediate' },
  { title: 'GST & Tax Planning for SMEs', category: 'Finance', featured: false, rating: 4.5, reviewCount: 53, difficulty: 'intermediate' },
  { title: 'Social Media Growth Hacks', category: 'Marketing', featured: true, rating: 4.8, reviewCount: 211, difficulty: 'beginner' },
  { title: 'Negotiation Skills for Founders', category: 'Sales', featured: false, rating: 4.6, reviewCount: 45, difficulty: 'all_levels' },
];

const INSTRUCTORS = [
  { name: 'Rahul Sharma', email: 'rahul.sharma@aimentra.com', bio: 'Marketing strategist with 15+ years helping Indian SMEs scale.' },
  { name: 'Priya Mehta', email: 'priya.mehta@aimentra.com', bio: 'Sales coach and former VP Sales at a Series B startup.' },
  { name: 'Amit Joshi', email: 'amit.joshi@aimentra.com', bio: 'Chartered accountant specializing in SME finance and compliance.' },
  { name: 'Sneha Reddy', email: 'sneha.reddy@aimentra.com', bio: 'HR consultant who has built teams for 50+ growing companies.' },
  { name: 'Vikram Singh', email: 'vikram.singh@aimentra.com', bio: 'Entrepreneur and mindset coach, 3x founder.' },
];

export async function seedDemoPopulation(adminUserId: any) {
  console.log('\n📦 Seeding demo population (users, enrollments, orders)...');

  const passwordHash = await bcrypt.hash('Student@123', 10);
  const categoryMap = Object.fromEntries((await Category.find()).map((c) => [c.name, c]));

  // Instructors
  const instructors: any[] = [];
  for (const ins of INSTRUCTORS) {
    let user = await User.findOne({ email: ins.email });
    if (!user) {
      user = await User.create({
        name: ins.name,
        email: ins.email,
        passwordHash,
        role: 'instructor',
        status: 'active',
        emailVerified: true,
      });
      console.log(`✅ Created instructor: ${ins.name}`);
    }
    instructors.push(user);
  }

  // Extra courses
  for (const [idx, c] of EXTRA_COURSES.entries()) {
    const slug = slugify(c.title);
    const cat = categoryMap[c.category];
    const instructor = instructors[idx % instructors.length];
    if (!(await Course.findOne({ slug })) && cat) {
      await Course.create({
        slug,
        title: c.title,
        shortDescription: `Practical ${c.category.toLowerCase()} training for Indian entrepreneurs and business owners.`,
        fullDescription: `<p>${c.title} is a comprehensive program designed for founders who want actionable results.</p>`,
        thumbnail: [
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80',
          'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
          'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
          'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&q=80',
          'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
          'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
          'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
        ][idx % 8],
        price: 9999,
        compareAtPrice: 19999,
        status: 'published',
        featured: c.featured,
        difficulty: c.difficulty,
        language: 'english',
        totalDuration: 600 + idx * 60,
        lessonCount: 24 + idx * 2,
        moduleCount: 4,
        rating: c.rating,
        reviewCount: c.reviewCount,
        learnerCount: 0,
        category: cat._id,
        instructor: instructor._id,
        instructorName: instructor.name,
        instructorBio: INSTRUCTORS.find((i) => i.email === instructor.email)?.bio,
        publishedAt: new Date(2018 + (idx % 8), idx % 12, 1),
        whatYouLearn: ['Practical frameworks', 'Real case studies', 'Action plans'],
        tags: [c.category.toLowerCase(), 'business'],
        sortOrder: idx + 10,
      });
      console.log(`✅ Created course: ${c.title}`);
    }
  }

  // Mark original courses featured + review counts
  await Course.updateMany(
    { title: { $in: ['Secrets of 10X Marketing', 'Sales Mastery Bootcamp', 'Finance for Entrepreneurs'] } },
    {
      $set: {
        featured: true,
        reviewCount: 320,
        publishedAt: new Date('2014-06-01'),
      },
    }
  );

  const plans = await Plan.find({ slug: { $in: ['gold', 'premium'] } });
  const goldPlan = plans.find((p) => p.slug === 'gold');
  const premiumPlan = plans.find((p) => p.slug === 'premium');
  const publishedCourses = await Course.find({ status: 'published' });

  // Students
  const students: any[] = [];
  for (let i = 0; i < 120; i++) {
    const email = `student${i + 1}@demo.aimentra.com`;
    let student = await User.findOne({ email });
    if (!student) {
      const fn = FIRST_NAMES[i % FIRST_NAMES.length];
      const ln = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
      student = await User.create({
        name: `${fn} ${ln}`,
        email,
        phone: `9${String(100000000 + i).slice(0, 9)}`,
        passwordHash,
        role: 'student',
        status: 'active',
        emailVerified: true,
        address: { city: CITIES[i % CITIES.length], country: 'India' },
        lastLoginAt: new Date(Date.now() - Math.random() * 30 * 86400000),
      });
    }
    students.push(student);
  }
  console.log(`✅ Ensured ${students.length} demo students`);

  // Orders + entitlements
  let orderCount = 0;
  for (let i = 0; i < 45; i++) {
    const student = students[i];
    const plan = i % 3 === 0 ? premiumPlan : goldPlan;
    if (!plan) continue;

    const existing = await Order.findOne({ userId: student._id, planId: plan._id, status: 'paid' });
    if (existing) continue;

    const subtotal = plan.price;
    const gst = Math.round(subtotal * 0.18);
    const total = subtotal + gst;
    const order = await Order.create({
      userId: student._id,
      planId: plan._id,
      courseIds: publishedCourses.map((c) => c._id),
      amount: subtotal,
      subtotal,
      gstAmount: gst,
      gstPercent: 18,
      totalAmount: total,
      currency: 'INR',
      status: 'paid',
      paymentGateway: 'manual',
      billingDetails: {
        name: student.name,
        email: student.email,
        phone: student.phone || '9999999999',
        address: student.address?.city || 'India',
        state: 'Madhya Pradesh',
      },
      createdAt: new Date(Date.now() - Math.random() * 180 * 86400000),
    });

    await Entitlement.create({
      userId: student._id,
      planId: plan._id,
      orderId: order._id,
      courses: publishedCourses.map((c) => c._id),
      allCourses: true,
      status: 'active',
      features: plan.features || [],
      lifetime: plan.lifetime || false,
      expiryDate: plan.lifetime ? undefined : new Date(Date.now() + 365 * 86400000),
      source: 'purchase',
    });
    orderCount++;
  }
  console.log(`✅ Created ${orderCount} paid orders with entitlements`);

  // Progress + certificates
  const lessons = await Lesson.find({ status: 'published' }).limit(200);
  let progressCount = 0;
  let certCount = 0;

  for (const student of students.slice(0, 80)) {
    const enrolledCourses = publishedCourses
      .sort(() => Math.random() - 0.5)
      .slice(0, 1 + Math.floor(Math.random() * 3));

    for (const course of enrolledCourses) {
      const courseLessons = lessons.filter((l) => String(l.courseId) === String(course._id)).slice(0, 6);
      let completedLessons = 0;

      for (const lesson of courseLessons) {
        const pct = 40 + Math.floor(Math.random() * 60);
        const completed = pct >= 90 || Math.random() > 0.6;
        await Progress.findOneAndUpdate(
          { userId: student._id, courseId: course._id, lessonId: lesson._id },
          {
            userId: student._id,
            courseId: course._id,
            lessonId: lesson._id,
            watchedSeconds: Math.floor((lesson.videoDuration || 300) * (pct / 100)),
            totalSeconds: lesson.videoDuration || 300,
            percentage: pct,
            completed,
            completedAt: completed ? new Date() : undefined,
            lastPosition: 0,
          },
          { upsert: true }
        );
        progressCount++;
        if (completed) completedLessons++;
      }

      const completionPct = courseLessons.length ? Math.round((completedLessons / courseLessons.length) * 100) : 0;
      if (completionPct >= 80) {
        const certNumber = `ITF-${Date.now().toString(36).toUpperCase()}-${String(student._id).slice(-4).toUpperCase()}`;
        if (!(await Certificate.findOne({ userId: student._id, courseId: course._id }))) {
          await Certificate.create({
            userId: student._id,
            courseId: course._id,
            certificateNumber: certNumber,
            studentName: student.name,
            courseName: course.title,
            instructorName: course.instructorName,
            completionDate: new Date(),
            issuedAt: new Date(),
            verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-certificate/${certNumber}`,
            status: 'issued',
          });
          certCount++;
        }
      }
    }
  }
  console.log(`✅ Created ${progressCount} progress records, ${certCount} certificates`);

  await syncDenormalizedCounts();
  console.log('✅ Synced course learner counts and category course counts');
}
