type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Transactional email service.
 * Uses Brevo/Resend/SMTP when configured; otherwise logs in development.
 */
export class EmailService {
  private enabled() {
    return !!(process.env.SMTP_HOST || process.env.BREVO_API_KEY || process.env.RESEND_API_KEY);
  }

  async send(payload: EmailPayload): Promise<boolean> {
    if (!this.enabled()) {
      console.log(`[Email:dev] To: ${payload.to} | ${payload.subject}`);
      console.log(payload.text || payload.html.slice(0, 200));
      return true;
    }

    // Brevo HTTP API (free tier)
    if (process.env.BREVO_API_KEY) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: process.env.EMAIL_FROM_NAME || 'Aimentra',
            email: process.env.EMAIL_FROM || 'noreply@aimentra.com',
          },
          to: [{ email: payload.to }],
          subject: payload.subject,
          htmlContent: payload.html,
          textContent: payload.text,
        }),
      });
      return res.ok;
    }

    // Resend HTTP API
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'Aimentra <noreply@aimentra.com>',
          to: [payload.to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
        }),
      });
      return res.ok;
    }

    // Nodemailer SMTP fallback
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@aimentra.com',
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      return true;
    } catch (err) {
      console.error('[Email] SMTP send failed', err);
      return false;
    }
  }

  async sendWelcome(to: string, name: string) {
    return this.send({
      to,
      subject: 'Welcome to Aimentra',
      html: `<p>Hi ${name},</p><p>Welcome aboard. Verify your email and explore our courses.</p>`,
      text: `Hi ${name}, welcome to Aimentra.`,
    });
  }

  async sendPasswordReset(to: string, resetUrl: string) {
    return this.send({
      to,
      subject: 'Reset your password',
      html: `<p>Click to reset your password (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      text: `Reset your password: ${resetUrl}`,
    });
  }

  async sendPurchaseConfirmation(to: string, planName: string, amount: number) {
    return this.send({
      to,
      subject: `Purchase confirmed — ${planName}`,
      html: `<p>Your purchase of <strong>${planName}</strong> (₹${amount}) is confirmed. Access is live now.</p>`,
      text: `Purchase confirmed: ${planName} for ₹${amount}.`,
    });
  }

  async sendExpiryReminder(to: string, planName: string, daysLeft: number) {
    return this.send({
      to,
      subject: `Your ${planName} access expires in ${daysLeft} days`,
      html: `<p>Your <strong>${planName}</strong> plan expires in ${daysLeft} days. Renew to keep learning.</p>`,
    });
  }

  async sendEmailVerification(to: string, verifyUrl: string) {
    return this.send({
      to,
      subject: 'Verify your email',
      html: `<p>Please verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
  }
}

export default new EmailService();
