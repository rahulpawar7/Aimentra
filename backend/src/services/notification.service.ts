import { Notification } from '../models';

type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  category: 'purchase' | 'course' | 'system' | 'expiry' | 'certificate';
  actionUrl?: string;
  icon?: string;
};

export class NotificationService {
  static async create(input: CreateNotificationInput) {
    return Notification.create({
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type || 'info',
      category: input.category,
      actionUrl: input.actionUrl,
      icon: input.icon,
    });
  }

  static async notifyPurchase(userId: string, planName: string, orderId: string) {
    return this.create({
      userId,
      title: 'Payment Successful',
      message: `Your purchase of ${planName} was successful. You now have full access.`,
      type: 'success',
      category: 'purchase',
      actionUrl: '/dashboard/courses',
    });
  }

  static async notifyCertificate(userId: string, courseName: string) {
    return this.create({
      userId,
      title: 'Certificate Earned!',
      message: `Congratulations on completing ${courseName}. View your certificate now.`,
      type: 'success',
      category: 'certificate',
      actionUrl: '/dashboard/certificates',
    });
  }

  static async notifyExpiry(userId: string, daysLeft: number) {
    return this.create({
      userId,
      title: 'Access Expiring Soon',
      message: `Your subscription expires in ${daysLeft} day(s). Renew to keep access.`,
      type: 'warning',
      category: 'expiry',
      actionUrl: '/dashboard/access',
    });
  }
}

export default NotificationService;
