const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to any provider like SendGrid, Mailgun, etc.
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendOTP(email, otp) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('⚠️ SMTP_USER or SMTP_PASS not set in .env. Skipping real email and using console for OTP.');
      console.log(`\n=================================\nMock Email OTP for ${email}: ${otp}\n=================================\n`);
      return { success: true, mocked: true };
    }

    try {
      const mailOptions = {
        from: `"EquipPeer" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Mã xác thực OTP của bạn - EquipPeer',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 10px;">
            <h2 style="color: #4CAF50; text-align: center;">Xác thực tài khoản EquipPeer</h2>
            <p style="font-size: 16px; color: #333;">Xin chào,</p>
            <p style="font-size: 16px; color: #333;">Bạn vừa yêu cầu mã xác thực OTP từ EquipPeer. Đây là mã của bạn:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #333; background-color: #e0e0e0; padding: 10px 20px; border-radius: 5px; letter-spacing: 5px;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #666; text-align: center;">Mã này sẽ hết hạn sau 10 phút.</p>
            <p style="font-size: 14px; color: #666; text-align: center;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
            <hr style="border: 0; border-top: 1px solid #ddd; margin: 30px 0;" />
            <p style="font-size: 12px; color: #999; text-align: center;">&copy; ${new Date().getFullYear()} EquipPeer. All rights reserved.</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      return { success: true, mocked: false };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
