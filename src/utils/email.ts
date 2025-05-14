import nodemailer from 'nodemailer';
import { EmailOptions } from '../types/email';
import { emailConfig } from '../config/vars';

const transporter = nodemailer.createTransport({
  host: emailConfig.host,
  port: emailConfig.port,
  auth: {
    user: emailConfig.username,
    pass: emailConfig.password,
  },
});

/**
 * Send an email
 * @param options Email options
 */
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  const mailOptions = {
    from: emailConfig.fromEmail,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  await transporter.sendMail(mailOptions);
};
