import User from '../models/User';
import Course from '../models/Course';
import Category from '../models/Category';
import Entitlement from '../models/Entitlement';
import Certificate from '../models/Certificate';
import Testimonial from '../models/Testimonial';
import Order from '../models/Order';
import Progress from '../models/Progress';

export type PublicStats = {
  totalStudents: number;
  totalUsers: number;
  publishedCourses: number;
  totalCourses: number;
  activeCategories: number;
  totalInstructors: number;
  totalEnrollments: number;
  averageRating: number;
  totalReviews: number;
  certificatesIssued: number;
  activeSubscriptions: number;
  totalRevenue: number;
  yearsExperience: number;
  featuredCourses: number;
  totalTestimonials: number;
};

export async function computePublicStats(): Promise<PublicStats> {
  const [
    totalStudents,
    totalUsers,
    publishedCourses,
    totalCourses,
    activeCategories,
    instructorIds,
    instructorUsers,
    enrollmentAgg,
    courseRatingAgg,
    certificatesIssued,
    activeSubscriptions,
    revenueAgg,
    totalTestimonials,
    featuredCourses,
    oldestCourse,
  ] = await Promise.all([
    User.countDocuments({ role: 'student', status: 'active' }),
    User.countDocuments({ status: { $ne: 'deleted' } }),
    Course.countDocuments({ status: 'published' }),
    Course.countDocuments(),
    Category.countDocuments({ active: true }),
    Course.distinct('instructor', { status: 'published' }),
    User.countDocuments({ role: 'instructor', status: 'active' }),
    Progress.aggregate([
      { $group: { _id: { userId: '$userId', courseId: '$courseId' } } },
      { $count: 'total' },
    ]),
    Course.aggregate([
      { $match: { status: 'published', reviewCount: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          weighted: { $sum: { $multiply: ['$rating', '$reviewCount'] } },
          reviews: { $sum: '$reviewCount' },
          avgSimple: { $avg: '$rating' },
        },
      },
    ]),
    Certificate.countDocuments(),
    Entitlement.countDocuments({ status: 'active' }),
    Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Testimonial.countDocuments({ approved: true }),
    Course.countDocuments({ status: 'published', featured: true }),
    Course.findOne({ status: 'published' }).sort({ publishedAt: 1, createdAt: 1 }).select('publishedAt createdAt'),
  ]);

  const ratingRow = courseRatingAgg[0];
  const averageRating =
    ratingRow?.reviews > 0
      ? Math.round((ratingRow.weighted / ratingRow.reviews) * 10) / 10
      : ratingRow?.avgSimple
        ? Math.round(ratingRow.avgSimple * 10) / 10
        : 0;

  const totalReviews = ratingRow?.reviews || 0;
  const totalEnrollments = enrollmentAgg[0]?.total || 0;
  const totalInstructors = Math.max(instructorIds.length, instructorUsers);
  const totalRevenue = revenueAgg[0]?.total || 0;

  const foundedAt = oldestCourse?.publishedAt || oldestCourse?.createdAt;
  const yearsExperience = foundedAt
    ? Math.max(1, new Date().getFullYear() - new Date(foundedAt).getFullYear())
    : 1;

  return {
    totalStudents,
    totalUsers,
    publishedCourses,
    totalCourses,
    activeCategories,
    totalInstructors,
    totalEnrollments,
    averageRating,
    totalReviews,
    certificatesIssued,
    activeSubscriptions,
    totalRevenue,
    yearsExperience,
    featuredCourses,
    totalTestimonials,
  };
}

export type StatDisplayItem = {
  label: string;
  value: string;
  suffix?: string;
  raw: number;
};

type CmsStatItem = {
  label: string;
  metric?: string;
  suffix?: string;
  decimals?: number;
  /** @deprecated legacy CMS numeric value — ignored when metric is set */
  value?: string;
};

export function resolveStatItems(
  items: CmsStatItem[] | undefined,
  stats: PublicStats
): StatDisplayItem[] {
  if (!items?.length) return [];

  return items
    .map((item) => {
      const metricKey = item.metric as keyof PublicStats | undefined;
      let raw = 0;

      if (metricKey && metricKey in stats) {
        raw = Number(stats[metricKey]) || 0;
      } else if (item.value !== undefined && item.value !== '') {
        raw = Number.parseFloat(String(item.value).replace(/,/g, '')) || 0;
      } else {
        return null;
      }

      const decimals = item.decimals ?? (metricKey === 'averageRating' ? 1 : 0);
      const formatted =
        decimals > 0 ? raw.toFixed(decimals) : Math.floor(raw).toLocaleString('en-IN');

      return {
        label: item.label,
        value: formatted,
        suffix: item.suffix || '',
        raw,
      };
    })
    .filter(Boolean) as StatDisplayItem[];
}

export function formatMetricValue(
  metric: keyof PublicStats,
  stats: PublicStats,
  options?: { suffix?: string; decimals?: number }
): string {
  const raw = Number(stats[metric]) || 0;
  const decimals = options?.decimals ?? (metric === 'averageRating' ? 1 : 0);
  const formatted = decimals > 0 ? raw.toFixed(decimals) : Math.floor(raw).toLocaleString('en-IN');
  return `${formatted}${options?.suffix || ''}`;
}

/** Sync denormalized counts on courses and categories from live data */
export async function syncDenormalizedCounts() {
  const categories = await Category.find();
  for (const cat of categories) {
    const count = await Course.countDocuments({ category: cat._id, status: 'published' });
    cat.courseCount = count;
    await cat.save();
  }

  const courses = await Course.find({ status: 'published' });
  for (const course of courses) {
    const enrollments = await Progress.distinct('userId', { courseId: course._id });
    course.learnerCount = enrollments.length;
    await course.save();
  }
}
