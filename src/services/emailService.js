const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT || '587');
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  } else {
    console.warn('[EMAIL SERVICE] No SMTP configured, using mock mode');
    transporter = null;
  }

  return transporter;
};

exports.sendOtpEmail = async (toEmail, otp) => {
  const subject = 'Mã OTP xác thực đăng ký tài khoản EquipPeer';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1b5e20;">EquipPeer</h2>
        <p style="color: #666;">Xác thực đăng ký tài khoản</p>
      </div>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="font-size: 16px; color: #333;">Mã OTP của bạn là:</p>
        <h1 style="font-size: 36px; letter-spacing: 8px; color: #1b5e20; margin: 10px 0;">${otp}</h1>
        <p style="font-size: 14px; color: #999;">Mã có hiệu lực trong 10 phút.</p>
      </div>
      <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">&copy; 2026 EquipPeer. All rights reserved.</p>
    </div>
  `;

  const t = getTransporter();

  if (!t) {
    console.log(`\n==================================================`);
    console.log(`[MOCK EMAIL] Gửi tới: ${toEmail}`);
    console.log(`[MOCK EMAIL] Subject: ${subject}`);
    console.log(`[MOCK EMAIL] OTP: ${otp}`);
    console.log(`==================================================\n`);
    return { success: true, provider: 'mock' };
  }

  try {
    const info = await t.sendMail({
      from: `"EquipPeer" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html
    });
    console.log(`[EMAIL SUCCESS] OTP sent to ${toEmail}, messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send OTP to ${toEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};
