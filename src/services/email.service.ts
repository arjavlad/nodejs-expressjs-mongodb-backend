import nodemailer from 'nodemailer';
import { emailConfig } from '../config/vars';
import { logger } from '../config/logger';

/**
 * Email service using Nodemailer
 */
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.port === 465, // true for 465, false for other ports
      auth: {
        user: emailConfig.username,
        pass: emailConfig.password,
      },
    });
  }

  /**
   * Send an email
   * @param to Recipient email
   * @param subject Email subject
   * @param text Plain text content
   * @param html HTML content (optional)
   * @returns Promise with send result
   */
  public async sendEmail(
    to: string | string[],
    subject: string,
    text: string,
    html?: string,
  ): Promise<nodemailer.SentMessageInfo> {
    try {
      const mailOptions = {
        from: emailConfig.fromEmail,
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        text,
        html: html || text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}`, { messageId: info.messageId });
      return info;
    } catch (error) {
      logger.error('Error sending email', error);
      throw error;
    }
  }

  /**
   * Send an email with template
   * @param to Recipient email
   * @param subject Email subject
   * @param template Template string or function
   * @param data Template data
   * @returns Promise with send result
   */
  public async sendTemplateEmail(
    to: string | string[],
    subject: string,
    template: string | ((data: Record<string, unknown>) => string),
    data: Record<string, unknown>,
  ): Promise<nodemailer.SentMessageInfo> {
    try {
      let html: string;

      if (typeof template === 'function') {
        html = template(data);
      } else {
        // Simple template replacement
        html = template.replace(/\{\{([^}]+)\}\}/g, (_match, key) => (data[key.trim()] as string) || '');
      }

      return this.sendEmail(to, subject, html, html);
    } catch (error) {
      logger.error('Error sending template email', error);
      throw error;
    }
  }

  /**
   * Send a welcome email to a new user
   * @param to Recipient email
   * @param name User's name
   * @returns Promise with send result
   */
  public async sendWelcomeEmail(to: string, name: string): Promise<nodemailer.SentMessageInfo> {
    const subject = 'Welcome to Our Platform';
    const text = `Hello ${name},\n\nWelcome to our platform! We're excited to have you on board.\n\nBest regards,\nThe Team`;
    const html = `
      <div>
        <h2>Welcome to Our Platform!</h2>
        <p>Hello ${name},</p>
        <p>We're excited to have you on board.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `;

    return this.sendEmail(to, subject, text, html);
  }

  /**
   * Send a password reset email
   * @param to Recipient email
   * @param resetToken Reset token
   * @param resetUrl Reset URL
   * @returns Promise with send result
   */
  public async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    resetUrl: string,
  ): Promise<nodemailer.SentMessageInfo> {
    const subject = 'Password Reset Request';
    const text = `You requested a password reset. Please use the following link to reset your password: ${resetUrl}?token=${resetToken}\n\nIf you didn't request this, please ignore this email.`;
    const html = `
      <div>
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Please use the following link to reset your password:</p>
        <p><a href="${resetUrl}?token=${resetToken}">Reset Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;

    return this.sendEmail(to, subject, text, html);
  }
}

export default new EmailService();
