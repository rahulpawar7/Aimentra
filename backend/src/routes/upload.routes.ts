import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { uploadImage as uploadImageMw, uploadVideo as uploadVideoMw, uploadDocument as uploadDocumentMw } from '../config/cloudinary';
import * as uploadController from '../controllers/upload.controller';

const router = Router();

router.post('/image', requireAdmin, uploadImageMw.single('file'), uploadController.uploadImage);
router.post('/video', requireAdmin, uploadVideoMw.single('file'), uploadController.uploadVideo);
router.post('/document', requireAdmin, uploadDocumentMw.single('file'), uploadController.uploadDocument);

export default router;
