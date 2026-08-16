import { Router } from 'express';
import { generateCertificate, getMyCertificates, verifyCertificate, downloadCertificate } from '../controllers/certificate.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/generate', requireAuth, generateCertificate);
router.get('/my', requireAuth, getMyCertificates);
router.get('/verify/:certificateNumber', verifyCertificate);
router.get('/:id/download', requireAuth, downloadCertificate);

export default router;
