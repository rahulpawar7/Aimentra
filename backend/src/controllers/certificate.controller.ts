import { Request, Response } from 'express';
import { Certificate, Course, Progress, Entitlement, User } from '../models';
import NotificationService from '../services/notification.service';

const generateCertNumber = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ITF-2026-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateCertificate = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: { message: 'Course not found' } });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    // Verify entitlement has certificate feature
    const entitlements = await Entitlement.find({ userId, status: 'active' });
    const canGenerate = entitlements.some(e => e.features && e.features.includes('certificate.generate'));
    
    if (!canGenerate) {
      return res.status(403).json({ success: false, error: { message: 'Your active plan does not support completion certificates' } });
    }

    let certificate = await Certificate.findOne({ userId, courseId });
    const certNumber = generateCertNumber();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    if (!certificate) {
      certificate = new Certificate({
        userId,
        courseId,
        studentName: user.name,
        courseName: course.title,
        instructorName: course.instructorName || 'Aimentra Instructor',
        completionDate: new Date(),
        certificateNumber: certNumber,
        issuedAt: new Date(),
        status: 'issued',
        verificationUrl: `${frontendUrl}/verify-certificate/${certNumber}`,
      });
      await certificate.save();
      NotificationService.notifyCertificate(userId, course.title).catch(() => {});
    }

    res.status(200).json({ success: true, data: certificate });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getMyCertificates = async (req: Request, res: Response) => {
  try {
    const certificates = await Certificate.find({ userId: req.user?.id }).populate('courseId', 'title slug thumbnail');
    res.status(200).json({ success: true, data: certificates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const { certificateNumber } = req.params;
    const certificate = await Certificate.findOne({ certificateNumber, status: 'issued' })
      .populate('courseId', 'title slug')
      .populate('userId', 'name email');

    if (!certificate) {
      return res.status(404).json({ success: false, error: { message: 'Invalid or revoked certificate number' } });
    }

    res.status(200).json({ success: true, data: certificate });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const downloadCertificate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const certificate = await Certificate.findOne({ _id: id, userId: req.user?.id });
    
    if (!certificate) {
      return res.status(404).json({ success: false, error: { message: 'Certificate not found' } });
    }

    res.status(200).json({
      success: true,
      data: {
        certificate,
        downloadUrl: certificate.downloadUrl || certificate.verificationUrl,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
