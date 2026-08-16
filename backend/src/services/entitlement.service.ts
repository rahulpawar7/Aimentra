import mongoose from 'mongoose';
import Entitlement from '../models/Entitlement';
import Plan from '../models/Plan';

export class EntitlementService {
  async getUserEntitlements(userId: string) {
    return Entitlement.find({
      userId,
      status: 'active',
      $or: [
        { expiryDate: { $gt: new Date() } },
        { expiryDate: null },
        { lifetime: true },
      ],
    });
  }

  async hasAccessToCourse(userId: string, courseId: string) {
    const entitlements = await this.getUserEntitlements(userId);
    return entitlements.some(e => {
      if (e.allCourses) return true;
      return e.courses && e.courses.map(id => id.toString()).includes(courseId.toString());
    });
  }

  async hasFeature(userId: string, featureKey: string) {
    const entitlements = await this.getUserEntitlements(userId);
    return entitlements.some(e => e.features && e.features.includes(featureKey));
  }

  async authorize(userId: string, courseId: string, lessonId?: string, featureKey?: string) {
    const hasCourse = await this.hasAccessToCourse(userId, courseId);
    if (!hasCourse) return { allowed: false, reason: 'Course access not included in your active plan' };

    if (featureKey) {
      const hasFeat = await this.hasFeature(userId, featureKey);
      if (!hasFeat) return { allowed: false, reason: `Feature '${featureKey}' not enabled for your plan` };
    }

    return { allowed: true };
  }

  async createEntitlement(userId: string, planId: string, orderId?: string) {
    const plan = await Plan.findById(planId);
    if (!plan) throw new Error('Plan not found');

    const startDate = new Date();
    let expiryDate: Date | undefined;
    if (!plan.lifetime && plan.durationDays) {
      expiryDate = new Date(startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    }

    const entitlement = new Entitlement({
      userId,
      planId,
      orderId,
      courses: plan.courses || [],
      allCourses: plan.allCourses || false,
      status: 'active',
      features: plan.features || [],
      startDate,
      expiryDate,
      lifetime: plan.lifetime || false,
      source: 'purchase',
    });

    return entitlement.save();
  }

  async revokeEntitlement(entitlementId: string, adminId: string, reason: string) {
    return Entitlement.findByIdAndUpdate(
      entitlementId,
      {
        status: 'revoked',
        revokedAt: new Date(),
        revokedBy: adminId,
        revokedReason: reason,
      },
      { new: true }
    );
  }

  async checkEntitlementExpiry() {
    return Entitlement.updateMany(
      {
        lifetime: false,
        expiryDate: { $lte: new Date() },
        status: 'active',
      },
      { status: 'expired' }
    );
  }
}

export default new EntitlementService();
