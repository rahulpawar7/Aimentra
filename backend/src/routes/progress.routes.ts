import { Router } from 'express';
import {
  updateProgress,
  getCourseProgress,
  getUserCoursesSummary,
  getContinueLearning,
  getCompletedCourses,
  getMyCourses,
  markCourseComplete,
  getMyDownloads,
  getRecentActivity,
} from '../controllers/progress.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, updateProgress);
router.get('/summary', requireAuth, getUserCoursesSummary);
router.get('/my-courses', requireAuth, getMyCourses);
router.get('/downloads', requireAuth, getMyDownloads);
router.get('/continue-learning', requireAuth, getContinueLearning);
router.get('/activity', requireAuth, getRecentActivity);
router.get('/completed', requireAuth, getCompletedCourses);
router.post('/course/:courseId/complete', requireAuth, markCourseComplete);
router.get('/course/:courseId', requireAuth, getCourseProgress);

export default router;
