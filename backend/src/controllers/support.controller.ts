import { Request, Response } from 'express';
import { nanoid } from 'nanoid';
import { SupportTicket, User } from '../models';
import NotificationService from '../services/notification.service';

const categoryMap: Record<string, string> = {
  'Technical / Bug': 'technical',
  'Billing / Invoice': 'billing',
  'Course Access': 'course',
  'Certificate Issue': 'course',
  Other: 'general',
};

export const createTicket = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { subject, category, content, priority = 'medium' } = req.body;
    const mappedCategory = categoryMap[category] || category || 'general';

    const ticket = await SupportTicket.create({
      ticketId: `TKT-${nanoid(8).toUpperCase()}`,
      userId,
      subject,
      category: mappedCategory,
      priority,
      status: 'open',
      messages: [{
        sender: userId,
        role: 'user',
        content,
        attachments: [],
        timestamp: new Date(),
      }],
    });

    res.status(201).json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const listMyTickets = async (req: Request, res: Response) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user!.id }).sort({ updatedAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getTicket = async (req: Request, res: Response) => {
  try {
    const ticket = await SupportTicket.findOne({
      $or: [{ _id: req.params.id }, { ticketId: req.params.id }],
      userId: req.user!.id,
    }).populate('messages.sender', 'name email role avatar');
    if (!ticket) return res.status(404).json({ success: false, error: { message: 'Ticket not found' } });
    res.json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const replyToTicket = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const ticket = await SupportTicket.findOne({
      $or: [{ _id: req.params.id }, { ticketId: req.params.id }],
      userId: req.user!.id,
    });
    if (!ticket) return res.status(404).json({ success: false, error: { message: 'Ticket not found' } });

    ticket.messages.push({
      sender: req.user!.id as any,
      role: 'user',
      content,
      attachments: [],
      timestamp: new Date(),
    });
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      ticket.status = 'open';
    }
    await ticket.save();
    res.json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const listAllTickets = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('userId', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SupportTicket.countDocuments(filter),
    ]);
    res.json({ success: true, data: { tickets, total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const assignTicket = async (req: Request, res: Response) => {
  try {
    const { assignedTo } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { assignedTo, status: 'in_progress' },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ success: false, error: { message: 'Ticket not found' } });
    res.json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const update: any = { status };
    if (status === 'resolved') update.resolvedAt = new Date();
    if (status === 'closed') update.closedAt = new Date();

    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!ticket) return res.status(404).json({ success: false, error: { message: 'Ticket not found' } });

    if (status === 'resolved' || status === 'closed') {
      await NotificationService.create({
        userId: ticket.userId.toString(),
        title: 'Support Ticket Resolved',
        message: `Your ticket "${ticket.subject}" has been marked as ${status}.`,
        type: 'info',
        category: 'system',
        actionUrl: '/dashboard/support',
      });
    }

    res.json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const adminReplyToTicket = async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ success: false, error: { message: 'Ticket not found' } });

    const adminUser = await User.findById(req.user!.id);
    ticket.messages.push({
      sender: req.user!.id as any,
      role: 'admin',
      content,
      attachments: [],
      timestamp: new Date(),
    });
    ticket.status = 'waiting';
    await ticket.save();

    await NotificationService.create({
      userId: ticket.userId.toString(),
      title: 'Support Reply',
      message: `New reply on ticket "${ticket.subject}".`,
      type: 'info',
      category: 'system',
      actionUrl: '/dashboard/support',
    });

    res.json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};

export const getAdminTicket = async (req: Request, res: Response) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('messages.sender', 'name email role avatar');
    if (!ticket) return res.status(404).json({ success: false, error: { message: 'Ticket not found' } });
    res.json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
