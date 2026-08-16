import { Router } from 'express';
import { listCourses, getCourse, getCurriculum, getCoursePlayer, markLessonComplete } from '../controllers/course.controller';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', listCourses);
router.get('/:slug', optionalAuth, getCourse);
router.get('/:slug/curriculum', optionalAuth, getCurriculum);
router.get('/:courseId/player/:lessonId', requireAuth, getCoursePlayer);
router.post('/:courseId/lessons/:lessonId/complete', requireAuth, markLessonComplete);

export default router;
