import { Request, Response } from 'express';
import { User, Entitlement, Order, Session, Plan } from '../../models';

export const listUsers = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const query: any = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(Number(limit)).select('-password'),
      User.countDocuments(query)
    ]);

    res.status(200).json({ success: true, data: { users, total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });

    const entitlements = await Entitlement.find({ userId: id }).populate('planId', 'name');
    const orders = await Order.find({ userId: id }).populate('planId', 'name').sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { user, entitlements, orders } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, role, status } = req.body;
    
    const user = await User.findByIdAndUpdate(id, { name, phone, role, status }, { new: true }).select('-password');
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const suspendUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, { status: 'suspended' });
    await Session.deleteMany({ userId: id });
    res.status(200).json({ success: true, data: { message: 'User suspended' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const activateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, { status: 'active' });
    res.status(200).json({ success: true, data: { message: 'User activated' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const grantAccess = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { planId, features, validUntil } = req.body;
    
    const plan = await Plan.findById(planId);
    const entitlement = new Entitlement({
      userId: id,
      planId,
      features: features || plan?.features || [],
      courses: plan?.courses || [],
      allCourses: plan?.allCourses || false,
      expiryDate: validUntil ? new Date(validUntil) : undefined,
      lifetime: plan?.lifetime || false,
      status: 'active',
      source: 'admin_grant',
      grantedBy: req.user?.id,
    });
    await entitlement.save();
    
    res.status(201).json({ success: true, data: entitlement });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const revokeAccess = async (req: Request, res: Response) => {
  try {
    const { id, entitlementId } = req.params;
    await Entitlement.findOneAndUpdate(
      { _id: entitlementId, userId: id },
      { status: 'revoked', revokedAt: new Date(), revokedBy: req.user?.id, revokedReason: 'admin_revoke' }
    );
    res.status(200).json({ success: true, data: { message: 'Access revoked' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
