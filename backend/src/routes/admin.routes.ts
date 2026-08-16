import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { getDashboard } from '../controllers/admin/dashboard.controller';
import * as usersAdmin from '../controllers/admin/users.controller';
import * as coursesAdmin from '../controllers/admin/courses.admin.controller';
import * as plansAdmin from '../controllers/admin/plans.admin.controller';
import * as opsAdmin from '../controllers/admin/ops.admin.controller';

const router = Router();

router.use(requireAuth, requireAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Users
router.get('/users', usersAdmin.listUsers);
router.get('/users/:id', usersAdmin.getUser);
router.patch('/users/:id', usersAdmin.updateUser);
router.post('/users/:id/suspend', usersAdmin.suspendUser);
router.post('/users/:id/activate', usersAdmin.activateUser);
router.post('/users/:id/grant', usersAdmin.grantAccess);
router.post('/users/:id/revoke/:entitlementId', usersAdmin.revokeAccess);

// Courses
router.get('/courses', coursesAdmin.listCourses);
router.get('/courses/:id', coursesAdmin.getCourseAdmin);
router.post('/courses', coursesAdmin.createCourse);
router.patch('/courses/:id', coursesAdmin.updateCourse);
router.delete('/courses/:id', coursesAdmin.deleteCourse);
router.post('/courses/:id/publish', coursesAdmin.publishCourse);
router.post('/courses/:id/archive', coursesAdmin.archiveCourse);

router.post('/courses/:courseId/modules', coursesAdmin.createModule);
router.patch('/courses/modules/:id', coursesAdmin.updateModule);
router.delete('/courses/modules/:id', coursesAdmin.deleteModule);
router.post('/courses/modules/reorder', coursesAdmin.reorderModules);

router.post('/courses/:moduleId/lessons', coursesAdmin.createLesson);
router.patch('/courses/lessons/:id', coursesAdmin.updateLesson);
router.delete('/courses/lessons/:id', coursesAdmin.deleteLesson);
router.post('/courses/lessons/reorder', coursesAdmin.reorderLessons);

// Plans
router.get('/plans', plansAdmin.listPlans);
router.post('/plans', plansAdmin.createPlan);
router.patch('/plans/:id', plansAdmin.updatePlan);
router.post('/plans/:id/toggle', plansAdmin.togglePlanStatus);

// Orders / refunds
router.get('/orders', opsAdmin.listOrders);
router.post('/orders/:id/refund', opsAdmin.refundOrder);

// Coupons
router.get('/coupons', opsAdmin.listCoupons);
router.post('/coupons', opsAdmin.createCoupon);
router.patch('/coupons/:id', opsAdmin.updateCoupon);
router.delete('/coupons/:id', opsAdmin.deleteCoupon);

// CMS
router.get('/cms', opsAdmin.listCMS);
router.put('/cms/:key', opsAdmin.upsertCMS);

// Analytics + audit
router.get('/analytics', opsAdmin.getAnalytics);
router.get('/audit-log', opsAdmin.getAuditLog);
router.get('/entitlements', opsAdmin.listEntitlements);
router.get('/certificates', opsAdmin.listCertificates);

export default router;
