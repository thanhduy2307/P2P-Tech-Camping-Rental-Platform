const crypto = require('crypto');
const qs = require('qs');
const moment = require('moment');

exports.createPaymentUrl = (req, orderId, amount, orderInfo) => {
  let ipAddr = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let tmnCode = process.env.vnp_TmnCode;
  let secretKey = process.env.vnp_HashSecret;
  let vnpUrl = process.env.vnp_Url;
  let returnUrl = process.env.vnp_ReturnUrl;

  let date = new Date();
  let createDate = moment(date).format('YYYYMMDDHHmmss');
  
  // Set expire date to 15 mins later
  let expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');

  let vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  // VNPay requires amount in VND * 100
  vnp_Params['vnp_Amount'] = amount * 100;
  vnp_Params['vnp_BankCode'] = 'NCB'; // Using test bank for sandbox
  vnp_Params['vnp_CreateDate'] = createDate;
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_OrderInfo'] = orderInfo;
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_TxnRef'] = orderId;
  vnp_Params['vnp_ExpireDate'] = expireDate;

  vnp_Params = sortObject(vnp_Params);

  let signData = qs.stringify(vnp_Params, { encode: false });
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");
  vnp_Params['vnp_SecureHash'] = signed;
  
  vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

  return vnpUrl;
};

exports.verifyReturnUrl = (vnp_Params) => {
  let secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);

  let secretKey = process.env.vnp_HashSecret;
  let signData = qs.stringify(vnp_Params, { encode: false });
  let hmac = crypto.createHmac("sha512", secretKey);
  let signed = hmac.update(new Buffer.from(signData, 'utf-8')).digest("hex");

  return secureHash === signed;
};

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}
