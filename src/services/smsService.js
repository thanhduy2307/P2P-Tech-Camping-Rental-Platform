const https = require('https');
const http = require('http');

/**
 * Helper to format phone number to international E.164 standard (+84...)
 */
const formatToInternational = (phone) => {
  let cleaned = phone.trim().replace(/[\s-]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+84' + cleaned.substring(1);
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
};

/**
 * Helper to execute HTTP/HTTPS requests natively without external packages
 */
const makeRequest = (url, method, headers, body) => {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: headers
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed = data;
          try {
            parsed = JSON.parse(data);
          } catch (e) {}
          resolve({ statusCode: res.statusCode, data: parsed });
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      if (body) {
        req.write(body);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Send SMS OTP to a real phone number
 * @param {string} phoneNumber - Recipient phone number (e.g. 0901234567)
 * @param {string} otp - 6-digit OTP code
 */
exports.sendSMS = async (phoneNumber, otp) => {
  const provider = process.env.SMS_PROVIDER || 'mock';
  const content = `Ma OTP xac thuc EquipPeer cua ban la: ${otp}. Hieu luc trong 10 phut.`;
  
  console.log(`[SMS SERVICE] Gửi OTP qua nhà cung cấp: ${provider}`);

  if (provider === 'mock') {
    console.log(`\n==================================================`);
    console.log(`[MOCK SMS] Gửi tới SĐT: ${phoneNumber}`);
    console.log(`[MOCK SMS] Nội dung: ${content}`);
    console.log(`==================================================\n`);
    return { success: true, provider: 'mock', message: 'Mock SMS logged' };
  }

  // 1. TWILIO INTEGRATION
  if (provider === 'twilio') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      console.warn('[SMS WARNING] Thiếu cấu hình Twilio (Account SID, Auth Token hoặc Phone Number) trong file .env');
      return { success: false, error: 'Missing Twilio configuration' };
    }

    const recipient = formatToInternational(phoneNumber);
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    // Twilio accepts urlencoded form data
    const params = new URLSearchParams();
    params.append('To', recipient);
    params.append('From', fromNumber);
    params.append('Body', content);
    const bodyString = params.toString();

    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(bodyString)
    };

    try {
      const response = await makeRequest(url, 'POST', headers, bodyString);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log(`[TWILIO SUCCESS] SMS Sent, SID: ${response.data.sid}`);
        return { success: true, sid: response.data.sid };
      } else {
        console.error('[TWILIO ERROR] Phản hồi lỗi:', response.data);
        return { success: false, error: response.data };
      }
    } catch (error) {
      console.error('[TWILIO ERROR] Lỗi kết nối:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 2. SPEED SMS INTEGRATION (speedsms.vn)
  if (provider === 'speedsms') {
    const apiKey = process.env.SPEEDSMS_API_KEY;
    if (!apiKey) {
      console.warn('[SMS WARNING] Thiếu cấu hình Speedsms API Key trong file .env');
      return { success: false, error: 'Missing SpeedSMS configuration' };
    }

    const url = 'http://api.speedsms.vn/index.php/sms/send';
    const authHeader = Buffer.from(`${apiKey}:x`).toString('base64');
    
    const bodyObj = {
      to: [phoneNumber],
      content: content,
      sms_type: 2,
      sender: process.env.SPEEDSMS_SENDER || ''
    };
    const bodyString = JSON.stringify(bodyObj);

    const headers = {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(bodyString)
    };

    try {
      const response = await makeRequest(url, 'POST', headers, bodyString);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log('[SPEEDSMS SUCCESS]', response.data);
        return { success: true, data: response.data };
      } else {
        console.error('[SPEEDSMS ERROR] Phản hồi lỗi:', response.data);
        return { success: false, error: response.data };
      }
    } catch (error) {
      console.error('[SPEEDSMS ERROR] Lỗi kết nối:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 3. E-SMS INTEGRATION (esms.vn)
  if (provider === 'esms') {
    const apiKey = process.env.ESMS_API_KEY;
    const secretKey = process.env.ESMS_SECRET_KEY;

    if (!apiKey || !secretKey) {
      console.warn('[SMS WARNING] Thiếu cấu hình eSMS ApiKey hoặc SecretKey trong file .env');
      return { success: false, error: 'Missing eSMS configuration' };
    }

    const url = `http://api.esms.vn/MainSMS/Json_SendSMS?Phone=${phoneNumber}&Content=${encodeURIComponent(content)}&ApiKey=${apiKey}&SecretKey=${secretKey}&SmsType=2&Brandname=${encodeURIComponent(process.env.ESMS_BRANDNAME || 'Baotim')}`;

    try {
      const response = await makeRequest(url, 'GET', {}, null);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log('[ESMS SUCCESS]', response.data);
        return { success: true, data: response.data };
      } else {
        console.error('[ESMS ERROR] Phản hồi lỗi:', response.data);
        return { success: false, error: response.data };
      }
    } catch (error) {
      console.error('[ESMS ERROR] Lỗi kết nối:', error.message);
      return { success: false, error: error.message };
    }
  }

  // 4. TELEGRAM BOT INTEGRATION
  if (provider === 'telegram') {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.warn('[SMS WARNING] Thiếu cấu hình Telegram Bot (TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID) trong file .env');
      return { success: false, error: 'Missing Telegram configuration' };
    }

    const text = `🔑 [EquipPeer OTP]\nSĐT đăng ký: ${phoneNumber}\nMã OTP: ${otp}\nThời gian: 10 phút.`;
    const url = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`;

    try {
      const response = await makeRequest(url, 'GET', {}, null);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log('[TELEGRAM SUCCESS] Tin nhắn OTP đã gửi qua Telegram Bot thành công.');
        return { success: true, data: response.data };
      } else {
        console.error('[TELEGRAM ERROR] Phản hồi lỗi:', response.data);
        return { success: false, error: response.data };
      }
    } catch (error) {
      console.error('[TELEGRAM ERROR] Lỗi kết nối Telegram:', error.message);
      return { success: false, error: error.message };
    }
  }

  console.warn(`[SMS WARNING] Nhà cung cấp dịch vụ SMS "${provider}" không được hỗ trợ.`);
  return { success: false, error: 'Unsupported SMS provider' };
};
