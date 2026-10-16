/**
 * VNPay & VietQR Payment Services
 * Real integration with VNPay Sandbox Gateway & VietQR Standard API
 */

// Official VNPay Sandbox Configuration
export const VNPAY_CONFIG = {
  get tmnCode() {
    return localStorage.getItem('yen_vnp_tmnCode') || 'DEMOV210';
  },
  get hashSecret() {
    return localStorage.getItem('yen_vnp_hashSecret') || 'RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ';
  },
  url: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
};

// VietQR - Thông tin tài khoản thật của Yen Homestay
export const VIETQR_MERCHANT = {
  bankCode: 'BIDV',
  accountNumber: '8860274070',
  accountName: 'DANG NGOC QUYEN',
  bankName: 'BIDV',
};

// Danh sách ngân hàng hỗ trợ VietQR (cho trường hợp mở rộng sau)
export const VIETQR_BANKS = [
  { id: 'BIDV', bin: '970418', name: 'BIDV', defaultAcc: '8860274070', holder: 'DANG NGOC QUYEN' },
  { id: 'MB', bin: '970422', name: 'MB Bank (Quân Đội)', defaultAcc: '0901234567', holder: 'DANG NGOC QUYEN' },
  { id: 'VCB', bin: '970436', name: 'Vietcombank', defaultAcc: '1012345678', holder: 'DANG NGOC QUYEN' },
];

/**
 * Generate real VietQR image URL using official VietQR Quick Link specification
 * https://img.vietqr.io/image/<BANK_BIN>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<MEMO>&accountName=<NAME>
 */
export function getVietQRUrl({ bankCode, accountNumber, amount = 0, memo = '', accountName, template = 'compact2' }) {
  // Dùng thông tin merchant thật nếu không truyền vào
  const bank = bankCode || VIETQR_MERCHANT.bankCode;
  const acc = accountNumber || VIETQR_MERCHANT.accountNumber;
  const name = accountName || VIETQR_MERCHANT.accountName;
  const cleanMemo = String(memo || '').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const encAccountName = encodeURIComponent(name);
  const encMemo = encodeURIComponent(cleanMemo);
  const roundedAmount = Math.max(0, Math.round(Number(amount) || 0));
  return `https://img.vietqr.io/image/${bank}-${acc}-${template}.png?amount=${roundedAmount}&addInfo=${encMemo}&accountName=${encAccountName}`;
}

/**
 * Generate HMAC-SHA512 hex string using standard Web Crypto API
 */
async function hmacSHA512(key, data) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const messageData = encoder.encode(data);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Format Date to VNPay format: yyyyMMddHHmmss
 */
function toVNPayDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const yr = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const da = pad(d.getDate());
  const hr = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const sc = pad(d.getSeconds());
  return `${yr}${mo}${da}${hr}${mi}${sc}`;
}

export const vnpayService = {
  /**
   * Tạo đường link thanh toán Cổng VNPAY Sandbox thật
   */
  async createPaymentUrl({ bookingCode, amount, orderInfo, returnUrl, bankCode }) {
    // 1. Thử gọi qua backend Spring Boot API trước
    try {
      const resp = await fetch('http://localhost:8081/api/public/vnpay/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingCode,
          amount: Math.round(Number(amount)),
          orderInfo: orderInfo || `Thanh toan dat phong ${bookingCode}`,
          returnUrl: returnUrl || `${window.location.origin}/complete-pay`,
          bankCode: bankCode || '',
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.paymentUrl) {
          return data.paymentUrl;
        }
      }
    } catch {
      // Fallback sang tạo URL trực tiếp bằng Web Crypto SHA-512
    }

    // 2. Client-side fallback: Tạo URL chuẩn theo đặc tả VNPay 2.1.0
    const now = new Date();
    const createDate = toVNPayDate(now);
    const expireDate = toVNPayDate(new Date(now.getTime() + 15 * 60 * 1000));
    const effectiveReturnUrl = returnUrl || `${window.location.origin}/complete-pay`;
    const vnpAmount = Math.round(Number(amount) * 100);

    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: VNPAY_CONFIG.tmnCode,
      vnp_Amount: String(vnpAmount),
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: '127.0.0.1',
      vnp_Locale: 'vn',
      vnp_OrderInfo: orderInfo || `Thanh toan don dat phong ${bookingCode}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: effectiveReturnUrl,
      vnp_TxnRef: bookingCode || `YEN-${Date.now()}`,
      vnp_ExpireDate: expireDate,
    };

    if (bankCode) {
      params.vnp_BankCode = bankCode;
    }

    // Sắp xếp các tham số theo thứ tự alphabet
    const sortedKeys = Object.keys(params).sort();
    const signDataParts = [];
    const queryParts = [];

    for (const key of sortedKeys) {
      const value = params[key];
      if (value !== null && value !== undefined && value !== '') {
        const encodedKey = encodeURIComponent(key);
        const encodedVal = encodeURIComponent(value);
        signDataParts.push(`${encodedKey}=${encodedVal}`);
        queryParts.push(`${encodedKey}=${encodedVal}`);
      }
    }

    const signData = signDataParts.join('&');
    const secureHash = await hmacSHA512(VNPAY_CONFIG.hashSecret, signData);
    const finalUrl = `${VNPAY_CONFIG.url}?${queryParts.join('&')}&vnp_SecureHash=${secureHash}`;

    return finalUrl;
  },

  /**
   * Kiểm tra mã phản hồi từ VNPay sau khi redirect về complete-pay
   */
  isSuccessResponse(code) {
    return code === '00';
  },

  /**
   * Giải mã thông báo lỗi theo mã VNPay response code
   */
  getResponseMessage(code) {
    const map = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.',
      '11': 'Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Thẻ/Tài khoản bị khóa.',
      '13': 'Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Khách hàng hủy giao dịch.',
      '51': 'Tài khoản không đủ số dư để thực hiện giao dịch.',
      '65': 'Tài khoản của quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Khách hàng nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Lỗi không xác định.',
    };
    return map[code] || 'Giao dịch không thành công';
  },
};
