package vn.edu.hcmuaf.fit.springboot.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.VNPayPaymentRequest;
import vn.edu.hcmuaf.fit.springboot.service.VNPayService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public/vnpay")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class VNPayController {

    private final VNPayService vnPayService;

    @PostMapping("/create-payment")
    public ResponseEntity<?> createPaymentUrl(@RequestBody VNPayPaymentRequest req, HttpServletRequest request) {
        try {
            String ipAddress = request.getHeader("X-Forwarded-For");
            if (ipAddress == null || ipAddress.isEmpty()) {
                ipAddress = request.getRemoteAddr();
            }
            String url = vnPayService.createPaymentUrl(req, ipAddress);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("paymentUrl", url);
            resp.put("bookingCode", req.getBookingCode());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Lỗi API tạo thanh toán VNPay: {}", e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }
}
