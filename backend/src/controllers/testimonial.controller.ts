import { Request, Response } from 'express';
import { Testimonial } from '../models';

const ADMIN_ROLES = ['super_admin', 'admin', 'content_manager', 'finance_manager'];

export const listTestimonials = async (req: Request, res: Response) => {
  try {
    const { featured, approved = 'true', all } = req.query;
    const filter: any = {};
    if (all === 'true') {
      const role = req.user?.role;
      if (!role || !ADMIN_ROLES.includes(role)) {
        filter.approved = true;
      }
    } else {
      if (approved === 'true') filter.approved = true;
      else if (approved === 'false') filter.approved = false;
    }
    if (featured === 'true') filter.featured = true;
    const testimonials = await Testimonial.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    res.json({ success: true, data: testimonials });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const createTestimonial = async (req: Request, res: Response) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    res.status(201).json({ success: true, data: testimonial });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateTestimonial = async (req: Request, res: Response) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!testimonial) return res.status(404).json({ success: false, error: { message: 'Not found' } });
    res.json({ success: true, data: testimonial });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const deleteTestimonial = async (req: Request, res: Response) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
