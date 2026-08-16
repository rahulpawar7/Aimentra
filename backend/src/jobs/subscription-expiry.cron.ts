import cron from 'node-cron';
import EntitlementService from '../services/entitlement.service';
import Entitlement from '../models/Entitlement';
import User from '../models/User';
import EmailService from '../services/email.service';

/**
 * Daily job: expire entitlements past expiresAt, send renewal reminders.
 */
export function startSubscriptionJobs() {
  // Every day at 01:15 server time
  cron.schedule('15 1 * * *', async () => {
    try {
      const result = await EntitlementService.checkEntitlementExpiry();
      console.log(`[cron] Expired entitlements:`, result.modifiedCount ?? result);
    } catch (err) {
      console.error('[cron] entitlement expiry failed', err);
    }
  });

  // Renewal reminders — 7 days before expiry, daily at 09:00
  cron.schedule('0 9 * * *', async () => {
    try {
      const inSevenDays = new Date();
      inSevenDays.setDate(inSevenDays.getDate() + 7);
      const start = new Date(inSevenDays);
      start.setHours(0, 0, 0, 0);
      const end = new Date(inSevenDays);
      end.setHours(23, 59, 59, 999);

      const soon = await Entitlement.find({
        status: 'active',
        lifetime: false,
        expiryDate: { $gte: start, $lte: end },
      }).populate('planId', 'name');

      for (const ent of soon) {
        const user = await User.findById(ent.userId).select('email name');
        const planName = (ent.planId as any)?.name || 'your plan';
        if (user?.email) {
          await EmailService.sendExpiryReminder(user.email, planName, 7);
        }
      }
      console.log(`[cron] Sent ${soon.length} expiry reminders`);
    } catch (err) {
      console.error('[cron] expiry reminder failed', err);
    }
  });

  console.log('⏰ Subscription cron jobs scheduled');
}
