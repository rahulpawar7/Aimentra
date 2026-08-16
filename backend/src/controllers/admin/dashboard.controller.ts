import { Request, Response } from 'express';
import { User, Order, Course, Certificate } from '../../models';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      totalUsers, newUsersToday, newUsersThisMonth,
      allOrders, pendingOrders,
      totalCourses, publishedCourses,
      totalCertificates,
      recentOrders, recentUsers,
      topCourses
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfToday } }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      
      Order.find({ status: 'paid' }),
      Order.countDocuments({ status: 'pending' }),
      
      Course.countDocuments(),
      Course.countDocuments({ status: 'published' }),
      
      Certificate.countDocuments(),
      
      Order.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'name email').populate('planId', 'name'),
      User.find().sort({ createdAt: -1 }).limit(10).select('-password'),
      
      Course.find().sort({ learnerCount: -1 }).limit(5)
    ]);

    let totalRevenue = 0;
    let revenueToday = 0;
    let revenueThisMonth = 0;

    allOrders.forEach(order => {
      totalRevenue += order.amount;
      if (order.createdAt >= startOfToday) revenueToday += order.amount;
      if (order.createdAt >= startOfMonth) revenueThisMonth += order.amount;
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers, newUsersToday, newUsersThisMonth,
        totalRevenue, revenueToday, revenueThisMonth,
        totalOrders: allOrders.length, pendingOrders,
        totalCourses, publishedCourses,
        totalCertificates,
        recentOrders, recentUsers, topCourses
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
