import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { email, resetLink } = await req.json();
    if (!email || !resetLink) {
      return NextResponse.json({ error: 'Email and resetLink are required.' }, { status: 400 });
    }

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      console.warn('SMTP credentials are not configured in environment variables.');
      return NextResponse.json({
        success: true,
        emailSent: false,
        reason: 'missing_smtp_config'
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure: parseInt(port, 10) === 465, // true for port 465, false for other ports (like 587)
      auth: {
        user,
        pass,
      },
    });

    await transporter.sendMail({
      from: `"Rapid Consultancy" <${user}>`,
      to: email,
      subject: 'Reset your password - Rapid Consultancy',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #E5E5E5; border-radius: 16px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #1A1A1A; font-size: 24px; font-weight: 600; margin: 0;">Rapid Consultancy</h2>
          </div>
          <h3 style="color: #1A1A1A; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Password Reset Request</h3>
          <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
            We received a request to reset the password for your account associated with this email address. Click the button below to choose a new password:
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" style="background-color: #B28E56; color: #ffffff; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 15px; display: inline-block; box-shadow: 0 2px 4px rgba(178, 142, 86, 0.2);">
              Reset Password
            </a>
          </div>
          <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-bottom: 8px;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
          <p style="color: #888888; font-size: 13px; line-height: 1.5; margin-top: 24px; word-break: break-all;">
            If the button above does not work, copy and paste this link into your browser:<br/>
            <a href="${resetLink}" style="color: #B28E56; text-decoration: underline;">${resetLink}</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #E5E5E5; margin: 32px 0 24px 0;" />
          <p style="color: #999999; font-size: 12px; text-align: center; margin: 0;">
            This link is valid for 1 hour. Please do not share this email or link with anyone.
          </p>
        </div>
      `
    });

    return NextResponse.json({ success: true, emailSent: true });
  } catch (err: any) {
    console.error('Server error sending reset email via SMTP:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
