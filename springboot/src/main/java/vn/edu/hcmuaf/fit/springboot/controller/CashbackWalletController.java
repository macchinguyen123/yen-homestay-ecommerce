package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.WalletResponseDTO;
import vn.edu.hcmuaf.fit.springboot.service.CashbackWalletService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public/cashback")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class CashbackWalletController {

    private final CashbackWalletService walletService;

    /**
     * Lấy dữ liệu ví hoàn tiền và lịch sử giao dịch (Phản hồi siêu tốc)
     */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getWallet(@PathVariable Long userId) {
        try {
            WalletResponseDTO dto = walletService.getWalletInfo(userId);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            log.error("Lỗi lấy thông tin ví user {}: {}", userId, e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi lấy thông tin ví: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

}
