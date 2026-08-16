import { Request, Response, NextFunction } from 'express';
import EntitlementService from '../services/entitlement.service';
import Lesson from '../models/Lesson';
import Course from '../models/Course';

/**
 * Server-side entitlement gate for course/lesson content.
 * Never trust a frontend "unlocked" flag alone.
 */
export const requirePlanForCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    // Admins bypass entitlement checks
    if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
      return next();
    }

    const courseId =
      (req.params.courseId as string) ||
      (req.body.courseId as string) ||
      (req.query.courseId as string);

    if (!courseId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'courseId required' },
      });
    }

    const allowed = await EntitlementService.hasAccessToCourse(userId, courseId);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PLAN_REQUIRED',
          message: 'Your active plan does not unlock this course',
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const requirePlanForLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const lessonId = req.params.lessonId || req.params.id || req.body.lessonId;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'lessonId required' },
      });
    }

    const lesson = await Lesson.findById(lessonId).select('courseId isPreview isFree');
    if (!lesson) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Lesson not found' },
      });
    }

    // Preview / free lessons are playable without entitlement
    if (lesson.isPreview || lesson.isFree) {
      (req as any).lesson = lesson;
      return next();
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
      (req as any).lesson = lesson;
      return next();
    }

    const allowed = await EntitlementService.hasAccessToCourse(userId, lesson.courseId.toString());
    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PLAN_REQUIRED',
          message: 'Your active plan does not unlock this lesson',
        },
      });
    }

    (req as any).lesson = lesson;
    next();
  } catch (error) {
    next(error);
  }
};

export const attachCourseAccessFlags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const course = await Course.findOne({ slug: req.params.slug }).select('_id');
    if (course && userId) {
      (req as any).hasCourseAccess = await EntitlementService.hasAccessToCourse(
        userId,
        course._id.toString()
      );
    } else {
      (req as any).hasCourseAccess = false;
    }
    next();
  } catch {
    (req as any).hasCourseAccess = false;
    next();
  }
};
