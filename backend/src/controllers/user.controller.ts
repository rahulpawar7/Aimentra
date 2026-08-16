import { Request, Response } from 'express';
import { User, Session, Entitlement } from '../models';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { name, phone, address, billingInfo } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(billingInfo !== undefined && { billingInfo }),
      },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    const { avatarUrl } = req.body;
    const user = await User.findByIdAndUpdate(req.user!.id, { avatar: avatarUrl }, { new: true });
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await Session.find({
      userId: req.user!.id,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    })
      .select('-refreshTokenHash')
      .sort({ lastUsedAt: -1 });
    res.json({ success: true, data: sessions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const deleteSession = async (req: Request, res: Response) => {
  try {
    await Session.findOneAndUpdate(
      { sessionId: req.params.sessionId, userId: req.user!.id },
      { revokedAt: new Date(), revokedReason: 'user_revoked' }
    );
    res.json({ success: true, message: 'Session deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const deleteAllSessions = async (req: Request, res: Response) => {
  try {
    await Session.updateMany(
      { userId: req.user!.id, revokedAt: { $exists: false } },
      { revokedAt: new Date(), revokedReason: 'user_revoked_all' }
    );
    res.json({ success: true, message: 'All sessions deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getMySubscription = async (req: Request, res: Response) => {
  try {
    const entitlements = await Entitlement.find({ userId: req.user!.id, status: 'active' })
      .populate('planId')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: entitlements });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
