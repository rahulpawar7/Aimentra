import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Progress, Course, Lesson, CourseCompletion } from '../models';
import EntitlementService from '../services/entitlement.service';

/** Course-wide progress: sum of lesson watch % divided by total lessons in the course */
function courseProgressPercent(totalPct: number, lessonCount: number): number {
  if (!lessonCount || lessonCount <= 0) return 0;
  return Math.min(100, Math.round(totalPct / lessonCount));
}

export const updateProgress = async (req: Request, res: Response) => {
  try {
    const { courseId, lessonId, completed, percentage, watchedSeconds, totalSeconds, lastPosition } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const hasAccess = await EntitlementService.hasAccessToCourse(userId, courseId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: { message: 'Access denied to this course' } });
    }

    const isCompleted = completed || percentage >= 90;

    const progress = await Progress.findOneAndUpdate(
      { userId, courseId, lessonId },
      {
        $set: {
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : undefined,
          percentage: percentage || 0,
          watchedSeconds: watchedSeconds || 0,
          totalSeconds: totalSeconds || 0,
          lastPosition: lastPosition || 0,
        },
      },
      { new: true, upsert: true }
    );

    // Auto-complete course when all required lessons are done
    await maybeAutoCompleteCourse(userId, courseId);

    res.status(200).json({ success: true, data: progress });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

async function maybeAutoCompleteCourse(userId: string, courseId: string) {
  const existing = await CourseCompletion.findOne({ userId, courseId });
  if (existing) return existing;

  const requiredLessons = await Lesson.find({
    courseId,
    status: 'published',
    isPreview: { $ne: true },
  }).select('_id');

  if (requiredLessons.length === 0) return null;

  const completedCount = await Progress.countDocuments({
    userId,
    courseId,
    lessonId: { $in: requiredLessons.map((l) => l._id) },
    completed: true,
  });

  if (completedCount >= requiredLessons.length) {
    return CourseCompletion.findOneAndUpdate(
      { userId, courseId },
      { completedAt: new Date(), certificateIssued: false },
      { upsert: true, new: true }
    );
  }
  return null;
}

export const markCourseComplete = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const hasAccess = await EntitlementService.hasAccessToCourse(userId, courseId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: { message: 'Access denied' } });
    }

    const completion = await CourseCompletion.findOneAndUpdate(
      { userId, courseId },
      { completedAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: completion });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getCourseProgress = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;
    const [progress, completion] = await Promise.all([
      Progress.find({ userId, courseId }),
      CourseCompletion.findOne({ userId, courseId }),
    ]);
    res.status(200).json({
      success: true,
      data: { lessons: progress, isCourseComplete: !!completion, completedAt: completion?.completedAt },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

/** Continue Learning — in-progress only (excludes completed courses) */
export const getContinueLearning = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const completedIds = (
      await CourseCompletion.find({ userId }).select('courseId')
    ).map((c) => c.courseId.toString());

    const progressRecords = await Progress.find({
      userId,
      courseId: { $nin: completedIds },
    })
      .populate('courseId', 'title slug thumbnail lessonCount totalDuration instructorName')
      .sort({ updatedAt: -1 });

    const map = new Map<string, any>();
    for (const record of progressRecords) {
      if (!record.courseId) continue;
      const cId = (record.courseId as any)._id.toString();
      if (completedIds.includes(cId)) continue;
      if (!map.has(cId)) {
        map.set(cId, {
          course: record.courseId,
          completedLessons: 0,
          totalProgress: 0,
          count: 0,
          lastPosition: record.lastPosition,
          lastLessonId: record.lessonId,
          updatedAt: record.updatedAt,
        });
      }
      const item = map.get(cId);
      if (record.completed) item.completedLessons++;
      item.totalProgress += record.percentage || 0;
      item.count++;
      if (record.updatedAt > item.updatedAt) {
        item.updatedAt = record.updatedAt;
        item.lastPosition = record.lastPosition;
        item.lastLessonId = record.lessonId;
      }
    }

    const data = Array.from(map.values())
      .filter((item) => item.count > 0)
      .map((item) => ({
        course: item.course,
        overallProgress: courseProgressPercent(
          item.totalProgress,
          (item.course as any)?.lessonCount || 0
        ),
        completedLessons: item.completedLessons,
        lastPosition: item.lastPosition,
        lastLessonId: item.lastLessonId,
        updatedAt: item.updatedAt,
      }));

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

/** Completed courses tab — per-user state, never a global course flag */
export const getCompletedCourses = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const completions = await CourseCompletion.find({ userId })
      .populate('courseId', 'title slug thumbnail lessonCount totalDuration instructorName')
      .sort({ completedAt: -1 });

    res.json({
      success: true,
      data: completions.map((c) => ({
        course: c.courseId,
        completedAt: c.completedAt,
        certificateIssued: c.certificateIssued,
        certificateId: c.certificateId,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getMyCourses = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const entitlements = await EntitlementService.getUserEntitlements(userId);
    const allCourses = entitlements.some((e) => e.allCourses);
    let courseIds: string[] = [];

    if (allCourses) {
      const courses = await Course.find({ status: 'published' }).select('_id');
      courseIds = courses.map((c) => c._id.toString());
    } else {
      const set = new Set<string>();
      for (const e of entitlements) {
        for (const id of e.courses || []) set.add(id.toString());
      }
      courseIds = Array.from(set);
    }

    const completedIds = new Set(
      (await CourseCompletion.find({ userId }).select('courseId')).map((c) => c.courseId.toString())
    );

    const courses = await Course.find({ _id: { $in: courseIds }, status: 'published' })
      .select('title slug thumbnail lessonCount totalDuration instructorName category')
      .populate('category', 'name slug');

    const progressRecords = await Progress.find({ userId, courseId: { $in: courseIds } });
    const progressByCourse = new Map<string, { completed: number; totalPct: number; count: number; lastLessonId?: string; lastUpdated?: Date }>();
    for (const p of progressRecords) {
      const cid = p.courseId.toString();
      if (!progressByCourse.has(cid)) progressByCourse.set(cid, { completed: 0, totalPct: 0, count: 0 });
      const item = progressByCourse.get(cid)!;
      if (p.completed) item.completed++;
      item.totalPct += p.percentage || 0;
      item.count++;
      if (!item.lastUpdated || p.updatedAt > item.lastUpdated) {
        item.lastUpdated = p.updatedAt;
        item.lastLessonId = p.lessonId.toString();
      }
    }

    const data = courses.map((course) => {
      const cid = course._id.toString();
      const prog = progressByCourse.get(cid);
      const hasStarted = !!(prog && prog.count > 0);
      return {
        course,
        isCompleted: completedIds.has(cid),
        hasStarted,
        overallProgress: prog
          ? courseProgressPercent(prog.totalPct, course.lessonCount || 0)
          : 0,
        completedLessons: prog?.completed || 0,
        lastLessonId: prog?.lastLessonId || null,
      };
    });

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getUserCoursesSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const completedIds = (await CourseCompletion.find({ userId }).select('courseId')).map((c) =>
      c.courseId.toString()
    );

    const inProgressCourseIds = await Progress.distinct('courseId', {
      userId,
      courseId: { $nin: completedIds },
    });

    const [completed, enrolledCourseIds, hoursAgg] = await Promise.all([
      CourseCompletion.countDocuments({ userId }),
      Progress.distinct('courseId', { userId }),
      Progress.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId!) } },
        { $group: { _id: null, total: { $sum: '$watchedSeconds' } } },
      ]),
    ]);

    const hoursWatched = (hoursAgg[0]?.total || 0) / 3600;

    res.status(200).json({
      success: true,
      data: {
        coursesEnrolled: enrolledCourseIds.length,
        inProgressCount: inProgressCourseIds.length,
        completedCount: completed,
        hoursWatched: Math.round(hoursWatched * 10) / 10,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const { Certificate, Order, Notification } = await import('../models');
    const activities: Array<{
      id: string;
      type: string;
      title: string;
      description: string;
      timestamp: Date;
      href?: string;
    }> = [];

    const [progressRows, completions, certificates, orders, notifications] = await Promise.all([
      Progress.find({ userId })
        .sort({ updatedAt: -1 })
        .limit(15)
        .populate('courseId', 'title slug _id')
        .populate('lessonId', 'title'),
      CourseCompletion.find({ userId })
        .sort({ completedAt: -1 })
        .limit(8)
        .populate('courseId', 'title slug _id'),
      Certificate.find({ userId }).sort({ issuedAt: -1 }).limit(5).select('courseName issuedAt certificateNumber'),
      Order.find({ userId, status: 'paid' }).sort({ createdAt: -1 }).limit(5).populate('planId', 'name'),
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(8).select('title message category createdAt actionUrl'),
    ]);

    for (const p of progressRows) {
      const course = p.courseId as any;
      const lesson = p.lessonId as any;
      if (!course?._id) continue;
      activities.push({
        id: `progress-${p._id}`,
        type: p.completed ? 'lesson_completed' : 'lesson_progress',
        title: p.completed ? 'Lesson completed' : 'Continued learning',
        description: `${lesson?.title || 'Lesson'} · ${course.title}`,
        timestamp: p.updatedAt,
        href: `/dashboard/courses/${course._id}${lesson?._id ? `?lesson=${lesson._id}` : ''}`,
      });
    }

    for (const c of completions) {
      const course = c.courseId as any;
      if (!course?._id) continue;
      activities.push({
        id: `completion-${c._id}`,
        type: 'course_completed',
        title: 'Course completed',
        description: course.title,
        timestamp: c.completedAt,
        href: `/dashboard/courses/${course._id}`,
      });
    }

    for (const cert of certificates) {
      activities.push({
        id: `cert-${cert._id}`,
        type: 'certificate',
        title: 'Certificate earned',
        description: cert.courseName,
        timestamp: cert.issuedAt,
        href: '/dashboard/certificates',
      });
    }

    for (const order of orders) {
      activities.push({
        id: `order-${order._id}`,
        type: 'purchase',
        title: 'Plan purchased',
        description: (order.planId as any)?.name || 'Course access',
        timestamp: order.createdAt,
        href: '/dashboard/orders',
      });
    }

    for (const n of notifications) {
      activities.push({
        id: `notif-${n._id}`,
        type: n.category || 'notification',
        title: n.title,
        description: n.message,
        timestamp: n.createdAt,
        href: n.actionUrl || '/dashboard/notifications',
      });
    }

    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    res.json({ success: true, data: activities.slice(0, 20) });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getMyDownloads = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const entitlements = await EntitlementService.getUserEntitlements(userId);
    const allCourses = entitlements.some((e) => e.allCourses);
    let courseIds: string[] = [];

    if (allCourses) {
      const courses = await Course.find({ status: 'published' }).select('_id');
      courseIds = courses.map((c) => c._id.toString());
    } else {
      const set = new Set<string>();
      for (const e of entitlements) {
        for (const id of e.courses || []) set.add(id.toString());
      }
      courseIds = Array.from(set);
    }

    const lessons = await Lesson.find({
      courseId: { $in: courseIds },
      status: 'published',
      downloadable: true,
      $or: [{ fileUrl: { $exists: true, $ne: '' } }, { externalUrl: { $exists: true, $ne: '' } }],
    })
      .select('title type fileUrl fileName externalUrl courseId')
      .populate('courseId', 'title slug');

    res.json({ success: true, data: lessons });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
