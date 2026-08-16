import { Request, Response } from 'express';
import { Course, CourseModule, Lesson, Progress } from '../models';
import EntitlementService from '../services/entitlement.service';

export const listCourses = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category, difficulty, language, search, featured, sort } = req.query;
    
    const query: any = { status: 'published' };
    
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (language) query.language = language;
    if (featured) query.featured = featured === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOption: any = {};
    if (sort === 'newest') sortOption.createdAt = -1;
    else if (sort === 'popular') sortOption.learnerCount = -1;
    else if (sort === 'price-low') sortOption.price = 1;
    else if (sort === 'price-high') sortOption.price = -1;
    else sortOption.createdAt = -1;

    const skip = (Number(page) - 1) * Number(limit);

    const [courses, total] = await Promise.all([
      Course.find(query).populate('category', 'name slug').sort(sortOption).skip(skip).limit(Number(limit)),
      Course.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: { courses, total, page: Number(page), limit: Number(limit) }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getCourse = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug }).populate('category', 'name slug');
    
    if (!course) {
      return res.status(404).json({ success: false, error: { message: 'Course not found' } });
    }

    let isEnrolled = false;
    if (req.user) {
      isEnrolled = await EntitlementService.hasAccessToCourse(req.user.id, course._id.toString());
    }

    res.status(200).json({
      success: true,
      data: { course, isEnrolled }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getCurriculum = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const isObjectId = /^[a-f\d]{24}$/i.test(slug);
    const course = isObjectId
      ? await Course.findById(slug)
      : await Course.findOne({ slug });

    if (!course) {
      return res.status(404).json({ success: false, error: { message: 'Course not found' } });
    }

    const userId = req.user?.id;
    const hasAccess =
      !!userId &&
      (req.user?.role === 'admin' ||
        req.user?.role === 'super_admin' ||
        (await EntitlementService.hasAccessToCourse(userId, course._id.toString())));

    const modules = await CourseModule.find({ courseId: course._id }).sort({ sortOrder: 1 }).lean();
    const moduleIds = modules.map((m) => m._id);
    const lessons = await Lesson.find({ moduleId: { $in: moduleIds } }).sort({ sortOrder: 1 }).lean();

    let progressMap = new Map<string, boolean>();
    if (userId) {
      const prog = await Progress.find({ userId, courseId: course._id }).select('lessonId completed');
      progressMap = new Map(prog.map((p) => [p.lessonId.toString(), !!p.completed]));
    }

    const result = modules.map((mod) => {
      return {
        _id: mod._id,
        title: mod.title,
        description: mod.description,
        sortOrder: mod.sortOrder,
        lessons: lessons
          .filter((l) => l.moduleId.toString() === mod._id.toString())
          .map((l) => {
            const unlocked = hasAccess || l.isPreview || l.isFree;
            return {
              _id: l._id,
              title: l.title,
              type: l.type,
              duration: l.videoDuration || 0,
              isFree: l.isFree,
              isPreview: l.isPreview,
              sortOrder: l.sortOrder,
              completed: progressMap.get(l._id.toString()) || false,
              locked: !unlocked,
              // Never leak playable URLs without entitlement (preview ok)
              videoUrl: unlocked ? l.videoUrl : undefined,
              videoPoster: l.videoPoster || l.videoThumbnail,
              content: unlocked && l.type !== 'video' ? l.content : undefined,
            };
          }),
      };
    });

    res.status(200).json({
      success: true,
      data: { courseId: course._id, title: course.title, modules: result, hasAccess },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getCoursePlayer = async (req: Request, res: Response) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const hasAccess = await EntitlementService.hasAccessToCourse(userId, courseId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: { message: 'You do not have access to this course' } });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, courseId });
    if (!lesson) {
      return res.status(404).json({ success: false, error: { message: 'Lesson not found' } });
    }

    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const markLessonComplete = async (req: Request, res: Response) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const hasAccess = await EntitlementService.hasAccessToCourse(userId, courseId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: { message: 'Access denied' } });
    }

    let progress = await Progress.findOne({ userId, courseId, lessonId });
    if (!progress) {
      progress = new Progress({
        userId,
        courseId,
        lessonId,
        completed: true,
        completedAt: new Date(),
        percentage: 100,
        lastPosition: 0
      });
      await progress.save();
    } else {
      progress.completed = true;
      progress.completedAt = new Date();
      progress.percentage = 100;
      await progress.save();
    }

    res.status(200).json({ success: true, data: progress });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
