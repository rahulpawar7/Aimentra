import { Request, Response } from 'express';
import { Plan } from '../../models';

export const listPlans = async (req: Request, res: Response) => {
  try {
    const plans = await Plan.find().sort({ sortOrder: 1 });
    res.status(200).json({ success: true, data: plans });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();
    res.status(201).json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const togglePlanStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findById(id);
    if (!plan) return res.status(404).json({ success: false, error: { message: 'Plan not found' } });
    
    plan.status = plan.status === 'active' ? 'inactive' : 'active';
    await plan.save();
    
    res.status(200).json({ success: true, data: plan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
