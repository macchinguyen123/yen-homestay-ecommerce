package vn.edu.hcmuaf.fit.springboot.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.edu.hcmuaf.fit.springboot.dto.VNPayPaymentRequest;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@Slf4j
public class VNPayService {

    @org.springframework.beans.factory.annotation.Value("${vnpay.tmn-code:DEMOV210}")
    private String vnpTmnCode;

    @org.springframework.beans.factory.annotation.Value("${vnpay.hash-secret:RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ}")
    private String vnpHashSecret;

    @org.springframework.beans.factory.annotation.Value("${vnpay.url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnpUrl;

    // Credentials mặc định cho sandbox demo (không cần cấu hình thêm)
    private static final String DEFAULT_TMN_CODE   = "DEMOV210";
    private static final String DEFAULT_HASH_SECRET = "RAOEXHYVSDDIIENYWSLDIIZTANXUXZFJ";
    private static final String DEFAULT_VNP_URL    = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    public String createPaymentUrl(VNPayPaymentRequest req, String clientIp) {
        try {
            long amountVnd = (req.getAmount() != null ? req.getAmount() : 100000L) * 100L;
            String vnp_TxnRef = req.getBookingCode() != null ? req.getBookingCode() : ("YEN" + System.currentTimeMillis());
            String vnp_IpAddr = (clientIp != null && !clientIp.isEmpty()) ? clientIp : "127.0.0.1";
            String returnUrl = (req.getReturnUrl() != null && !req.getReturnUrl().isEmpty())
                    ? req.getReturnUrl()
                    : "http://localhost:5173/complete-pay"; // ← Đổi thành domain thật khi deploy

            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cld.getTime());

            cld.add(Calendar.MINUTE, 15);
            String vnp_ExpireDate = formatter.format(cld.getTime());

            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", "2.1.0");
            vnp_Params.put("vnp_Command", "pay");
            vnp_Params.put("vnp_TmnCode", (vnpTmnCode != null && !vnpTmnCode.isEmpty()) ? vnpTmnCode : DEFAULT_TMN_CODE);
            vnp_Params.put("vnp_Amount", String.valueOf(amountVnd));
            vnp_Params.put("vnp_CurrCode", "VND");
            if (req.getBankCode() != null && !req.getBankCode().isEmpty()) {
                vnp_Params.put("vnp_BankCode", req.getBankCode());
            }
            vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
            String orderInfo = req.getOrderInfo() != null ? req.getOrderInfo() : ("Thanh toan don dat phong " + vnp_TxnRef);
            vnp_Params.put("vnp_OrderInfo", orderInfo);
            vnp_Params.put("vnp_OrderType", "other");
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", returnUrl);
            vnp_Params.put("vnp_IpAddr", vnp_IpAddr);
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);
            vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);

            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty()) {
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));

                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));

                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                }
            }

            String queryUrl = query.toString();
            String secret = (vnpHashSecret != null && !vnpHashSecret.isEmpty()) ? vnpHashSecret : DEFAULT_HASH_SECRET;
            String baseUrl = (vnpUrl != null && !vnpUrl.isEmpty()) ? vnpUrl : DEFAULT_VNP_URL;
            String vnp_SecureHash = hmacSHA512(secret, hashData.toString());
            queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

            return baseUrl + "?" + queryUrl;
        } catch (Exception e) {
            log.error("Lỗi tạo URL VNPay: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi tạo đường link thanh toán VNPay: " + e.getMessage());
        }
    }

    public static String hmacSHA512(final String key, final String data) {
        try {
            if (key == null || data == null) {
                throw new NullPointerException();
            }
            final Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] hmacKeyBytes = key.getBytes(StandardCharsets.UTF_8);
            final SecretKeySpec secretKey = new SecretKeySpec(hmacKeyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception ex) {
            return "";
        }
    }
}
