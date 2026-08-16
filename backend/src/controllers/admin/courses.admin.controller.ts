import { Request, Response } from 'express';
import { Course, CourseModule, Lesson } from '../../models';
import slugify from 'slugify';

export const listCourses = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const query: any = {};
    if (status && status !== 'All') query.status = String(status).toLowerCase();
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [courses, total] = await Promise.all([
      Course.find(query).populate('category', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Course.countDocuments(query),
    ]);
    res.status(200).json({ success: true, data: { courses, total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getCourseAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id).populate('category', 'name');
    if (!course) {
      return res.status(404).json({ success: false, error: { message: 'Course not found' } });
    }
    const modules = await CourseModule.find({ courseId: course._id }).sort({ sortOrder: 1 }).lean();
    const moduleIds = modules.map((m) => m._id);
    const lessons = await Lesson.find({ moduleId: { $in: moduleIds } }).sort({ sortOrder: 1 }).lean();
    const modulesWithLessons = modules.map((m) => ({
      ...m,
      lessons: lessons.filter((l) => l.moduleId.toString() === m._id.toString()),
    }));
    res.status(200).json({ success: true, data: { course, modules: modulesWithLessons } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: { message: 'Title is required' } });
    }
    const slug = slugify(title, { lower: true, strict: true });
    const course = new Course({
      instructor: req.user?.id,
      instructorName: req.body.instructorName || req.user?.email || 'Instructor',
      ...req.body,
      slug,
    });
    await course.save();
    res.status(201).json({ success: true, data: course });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (req.body.title) {
      req.body.slug = slugify(req.body.title, { lower: true, strict: true });
    }
    const course = await Course.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, data: course });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const modules = await CourseModule.find({ courseId: id }).select('_id');
    await Lesson.deleteMany({ moduleId: { $in: modules.map((m) => m._id) } });
    await CourseModule.deleteMany({ courseId: id });
    await Course.findByIdAndDelete(id);

    res.status(200).json({ success: true, data: { message: 'Course deleted' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const publishCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndUpdate(id, { status: 'published' }, { new: true });
    res.status(200).json({ success: true, data: course });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const archiveCourse = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndUpdate(id, { status: 'archived' }, { new: true });
    res.status(200).json({ success: true, data: course });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const createModule = async (req: Request, res: Response) => {
  try {
    const mod = new CourseModule(req.body);
    await mod.save();
    res.status(201).json({ success: true, data: mod });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const mod = await CourseModule.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, data: mod });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const deleteModule = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await CourseModule.findByIdAndDelete(id);
    await Lesson.deleteMany({ moduleId: id });
    res.status(200).json({ success: true, data: { message: 'Module deleted' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const createLesson = async (req: Request, res: Response) => {
  try {
    const lesson = new Lesson(req.body);
    await lesson.save();
    res.status(201).json({ success: true, data: lesson });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateLesson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, data: lesson });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const deleteLesson = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Lesson.findByIdAndDelete(id);
    res.status(200).json({ success: true, data: { message: 'Lesson deleted' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const reorderModules = async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    await Promise.all(updates.map((u: any) => CourseModule.findByIdAndUpdate(u.moduleId, { sortOrder: u.sortOrder })));
    res.status(200).json({ success: true, data: { message: 'Reordered' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const reorderLessons = async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    await Promise.all(updates.map((u: any) => Lesson.findByIdAndUpdate(u.lessonId, { sortOrder: u.sortOrder })));
    res.status(200).json({ success: true, data: { message: 'Reordered' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
