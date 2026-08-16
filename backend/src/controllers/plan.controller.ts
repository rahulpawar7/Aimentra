import { Request, Response } from 'express';
import { Plan } from '../models';

export const listPlans = async (req: Request, res: Response) => {
  try {
    const plans = await Plan.find({ status: 'active' }).sort({ sortOrder: 1 });
    res.status(200).json({ success: true, data: plans });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getPlan = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const plan = await Plan.findOne({ slug, status: 'active' });
    
    if (!plan) {
      return res.status(404).json({ success: false, error: { message: 'Plan not found' } });
    }

    res.status(200).json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
