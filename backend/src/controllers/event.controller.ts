import { Request, Response } from 'express';
import { Event, EventRegistration } from '../models';
import { uniqueSlug } from '../utils/slug';

export const listEvents = async (req: Request, res: Response) => {
  try {
    const { status, upcoming, page = 1, limit = 20 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    else if (upcoming === 'true') {
      filter.status = { $in: ['upcoming', 'live'] };
      filter.date = { $gte: new Date() };
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [events, total] = await Promise.all([
      Event.find(filter).sort({ date: 1 }).skip(skip).limit(Number(limit)),
      Event.countDocuments(filter),
    ]);
    res.json({ success: true, data: { events, total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getEventBySlug = async (req: Request, res: Response) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug });
    if (!event) return res.status(404).json({ success: false, error: { message: 'Event not found' } });
    res.json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const slug = await uniqueSlug(Event, req.body.title);
    const event = await Event.create({ ...req.body, slug });
    res.status(201).json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: { message: 'Event not found' } });
    if (req.body.title && req.body.title !== event.title) {
      event.slug = await uniqueSlug(Event, req.body.title, event._id.toString());
    }
    Object.assign(event, req.body);
    await event.save();
    res.json({ success: true, data: event });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const registerForEvent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: { message: 'Event not found' } });
    }

    if (event.status === 'cancelled' || event.status === 'completed') {
      return res.status(400).json({ success: false, error: { message: 'Registration is closed for this event' } });
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return res.status(400).json({ success: false, error: { message: 'Registration deadline has passed' } });
    }

    const existing = await EventRegistration.findOne({ eventId: event._id, userId, status: 'registered' });
    if (existing) {
      return res.status(200).json({ success: true, data: { message: 'Already registered', registration: existing } });
    }

    if (event.capacity && event.registeredCount >= event.capacity) {
      return res.status(400).json({ success: false, error: { message: 'Event is full' } });
    }

    const registration = await EventRegistration.create({ eventId: event._id, userId });
    event.registeredCount = (event.registeredCount || 0) + 1;
    await event.save();

    res.status(201).json({ success: true, data: { registration, event } });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(200).json({ success: true, data: { message: 'Already registered' } });
    }
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getMyEventRegistrations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: { message: 'Authentication required' } });
    }
    const registrations = await EventRegistration.find({ userId, status: 'registered' })
      .populate('eventId')
      .sort({ registeredAt: -1 });
    res.json({ success: true, data: registrations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
