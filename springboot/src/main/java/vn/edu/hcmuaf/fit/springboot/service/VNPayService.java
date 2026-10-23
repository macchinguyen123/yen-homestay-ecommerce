package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.dto.VNPayPaymentRequest;
import vn.edu.hcmuaf.fit.springboot.model.Booking;
import vn.edu.hcmuaf.fit.springboot.model.Payment;
import vn.edu.hcmuaf.fit.springboot.repository.BookingRepository;
import vn.edu.hcmuaf.fit.springboot.repository.PaymentRepository;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class VNPayService {

    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;

    @Value("${vnpay.tmn-code:UUDTD194}")
    private String vnpTmnCode;

    @Value("${vnpay.hash-secret:LYJHAENUIDAXWTKZDXXTJDPGGUGDNLOT}")
    private String vnpHashSecret;

    @Value("${vnpay.url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String vnpUrl;

    // Credentials mặc định theo tài khoản VNPay Sandbox của bạn
    private static final String DEFAULT_TMN_CODE    = "UUDTD194";
    private static final String DEFAULT_HASH_SECRET = "LYJHAENUIDAXWTKZDXXTJDPGGUGDNLOT";
    private static final String DEFAULT_VNP_URL     = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    /**
     * Tạo đường dẫn thanh toán tới Cổng VNPay Sandbox
     */
    public String createPaymentUrl(VNPayPaymentRequest req, String clientIp) {
        try {
            long amountVnd = (req.getAmount() != null ? req.getAmount() : 100000L) * 100L;
            String vnp_TxnRef = req.getBookingCode() != null ? req.getBookingCode() : ("YEN" + System.currentTimeMillis());
            String vnp_IpAddr = (clientIp != null && !clientIp.isEmpty() && !clientIp.contains(":")) ? clientIp : "127.0.0.1";
            String returnUrl = (req.getReturnUrl() != null && !req.getReturnUrl().isEmpty())
                    ? req.getReturnUrl()
                    : "http://localhost:5173/complete-pay";

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

            log.info("Khởi tạo URL VNPay Sandbox thành công cho mã đơn: {}", vnp_TxnRef);
            return baseUrl + "?" + queryUrl;
        } catch (Exception e) {
            log.error("Lỗi tạo URL VNPay: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi tạo đường link thanh toán VNPay: " + e.getMessage());
        }
    }

    /**
     * Xác thực chữ ký số VNPay và cập nhật trạng thái đơn đặt phòng trong CSDL
     */
    @Transactional
    public Map<String, Object> processReturn(Map<String, String> fields) {
        Map<String, Object> response = new HashMap<>();
        String vnp_SecureHash = fields.get("vnp_SecureHash");

        Map<String, String> vnp_Params = new HashMap<>();
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            String fieldName = entry.getKey();
            String fieldValue = entry.getValue();
            if (fieldValue != null && !fieldValue.isEmpty()
                    && !fieldName.equalsIgnoreCase("vnp_SecureHash")
                    && !fieldName.equalsIgnoreCase("vnp_SecureHashType")) {
                vnp_Params.put(fieldName, fieldValue);
            }
        }

        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = vnp_Params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                try {
                    hashData.append(fieldName).append('=').append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                } catch (Exception e) {
                    hashData.append(fieldName).append('=').append(fieldValue);
                }
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }

        String secret = (vnpHashSecret != null && !vnpHashSecret.isEmpty()) ? vnpHashSecret : DEFAULT_HASH_SECRET;
        String signValue = hmacSHA512(secret, hashData.toString());

        boolean isValidSignature = signValue.equalsIgnoreCase(vnp_SecureHash);
        String responseCode = fields.get("vnp_ResponseCode");
        String txnRef = fields.get("vnp_TxnRef");
        String transactionNo = fields.get("vnp_TransactionNo");
        String bankCode = fields.get("vnp_BankCode");
        String amountStr = fields.get("vnp_Amount");
        long amount = 0;
        try {
            if (amountStr != null) amount = Long.parseLong(amountStr) / 100;
        } catch (Exception ignored) {}

        response.put("isValidSignature", isValidSignature);
        response.put("responseCode", responseCode);
        response.put("bookingCode", txnRef);
        response.put("transactionNo", transactionNo);
        response.put("bankCode", bankCode);
        response.put("amount", amount);

        if (isValidSignature && "00".equals(responseCode)) {
            response.put("success", true);
            response.put("message", "Thanh toán qua VNPAY thành công!");

            // Cập nhật trạng thái đơn đặt phòng trong CSDL
            if (txnRef != null && !txnRef.isEmpty()) {
                final BigDecimal payAmount = BigDecimal.valueOf(amount);
                bookingRepository.findByBookingCode(txnRef).ifPresent(booking -> {
                    booking.setDepositStatus("PAID");
                    booking.setStatus("CONFIRMED");
                    bookingRepository.save(booking);

                    // Thêm bản ghi Payment
                    try {
                        Payment payment = Payment.builder()
                                .bookingId(booking.getId())
                                .amount(payAmount)
                                .paymentMethod("VNPAY")
                                .transactionCode(transactionNo != null ? transactionNo : ("VNP" + System.currentTimeMillis()))
                                .status("SUCCESS")
                                .paidAt(LocalDateTime.now())
                                .build();
                        paymentRepository.save(payment);
                        log.info("Đã cập nhật trạng thái PAID & CONFIRMED thành công cho đơn {}", txnRef);
                    } catch (Exception pe) {
                        log.warn("Không thể lưu bản ghi Payment cho đơn {}: {}", txnRef, pe.getMessage());
                    }
                });
            }
        } else {
            response.put("success", false);
            response.put("message", isValidSignature
                    ? "Giao dịch không thành công hoặc bị hủy (Mã phản hồi: " + responseCode + ")"
                    : "Chữ ký số checksum không hợp lệ");
        }

        return response;
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
