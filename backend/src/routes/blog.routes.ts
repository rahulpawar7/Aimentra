import { Router } from 'express';
import { requireAdmin, optionalAuth } from '../middleware/auth';
import * as blogController from '../controllers/blog.controller';

const router = Router();

router.get('/', optionalAuth, blogController.listBlogs);
router.get('/:slug', blogController.getBlogBySlug);
router.post('/', requireAdmin, blogController.createBlog);
router.put('/:id', requireAdmin, blogController.updateBlog);
router.delete('/:id', requireAdmin, blogController.deleteBlog);

export default router;
