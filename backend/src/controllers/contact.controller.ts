import { Request, Response } from 'express';
import EmailService from '../services/email.service';

export const submitContact = async (req: Request, res: Response) => {
  try {
    const { name, email, message, phone } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: { message: 'Name, email, and message are required' } });
    }

    const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'support@aimentra.com';

    await EmailService.send({
      to: supportEmail,
      subject: `[Contact Form] Message from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      text: `Name: ${name}\nEmail: ${email}\n${phone ? `Phone: ${phone}\n` : ''}Message:\n${message}`,
    });

    res.json({ success: true, message: 'Your message has been sent. We will get back to you within 24 hours.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { message: error.message } });
  }
};
