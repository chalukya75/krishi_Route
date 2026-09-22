const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    // Dev mode: console transport
    return null;
  }

  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // upgrades to STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  // Special handling for Gmail to increase reliability
  if (process.env.SMTP_HOST.includes('gmail.com')) {
    config.service = 'gmail';
    delete config.host;
    delete config.port;
    delete config.secure;
  }

  return nodemailer.createTransport(config);
};

const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  const transporter = createTransporter();
  const subject = purpose === 'reset' ? 'Krishi-Route Password Reset OTP' : 'Krishi-Route Email Verification OTP';
  const heading = purpose === 'reset' ? 'Password Reset Request' : 'Email Verification';
  const body = `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:48px;">🌾</span>
      <h1 style="color:#2E7D32;margin:8px 0 4px;">Krishi-Route</h1>
      <p style="color:#6B7280;margin:0;">Smart Agriculture Logistics</p>
    </div>
    <div style="background:#fff;border-radius:8px;padding:24px;border:1px solid #E5E7EB;">
      <h2 style="color:#111827;margin:0 0 12px;">${heading}</h2>
      <p style="color:#374151;">Your One-Time Password is:</p>
      <div style="background:#F0FDF4;border:2px solid #16A34A;border-radius:8px;padding:16px;text-align:center;margin:16px 0;">
        <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#16A34A;">${otp}</span>
      </div>
      <p style="color:#6B7280;font-size:14px;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
    </div>
    <p style="color:#9CA3AF;font-size:12px;text-align:center;margin-top:16px;">© 2026 Krishi-Route. A smart agriculture initiative.</p>
  </div>
  `;

  if (!transporter) {
    // Dev mode: print to console
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SMTP configuration missing in production environment');
    }
    console.log(`\n📧 [DEV MODE] OTP for ${email}: ${otp} (purpose: ${purpose})\n`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Krishi-Route" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html: body,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`\n⚠️ [DEV MODE] Email delivery failed (${error.code || error.message}).`);
      console.log(`📧 [DEV MODE] OTP for ${email}: ${otp} (purpose: ${purpose})\n`);
      return;
    }
    throw error;
  }
};

module.exports = { sendOTPEmail };
