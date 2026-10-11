package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.UpdateBankRequestDTO;
import vn.edu.hcmuaf.fit.springboot.dto.UpdatePinRequestDTO;
import vn.edu.hcmuaf.fit.springboot.dto.WalletResponseDTO;
import vn.edu.hcmuaf.fit.springboot.dto.WithdrawRequestDTO;
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

    /**
     * Rút tiền về ngân hàng
     */
    @PostMapping("/{userId}/withdraw")
    public ResponseEntity<?> withdraw(@PathVariable Long userId, @RequestBody WithdrawRequestDTO request) {
        try {
            WalletResponseDTO updated = walletService.withdraw(userId, request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Đã gửi yêu cầu rút tiền thành công!");
            resp.put("wallet", updated);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            log.error("Lỗi rút tiền user {}: {}", userId, e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi rút tiền: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    /**
     * Cập nhật thông tin ngân hàng liên kết
     */
    @PostMapping("/{userId}/bank")
    public ResponseEntity<?> updateBank(@PathVariable Long userId, @RequestBody UpdateBankRequestDTO request) {
        try {
            WalletResponseDTO updated = walletService.updateBank(userId, request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Đã liên kết ngân hàng thành công!");
            resp.put("wallet", updated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Lỗi cập nhật ngân hàng user {}: {}", userId, e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi cập nhật ngân hàng: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    /**
     * Cập nhật mã PIN ví 6 chữ số
     */
    @PostMapping("/{userId}/pin")
    public ResponseEntity<?> updatePin(@PathVariable Long userId, @RequestBody UpdatePinRequestDTO request) {
        try {
            WalletResponseDTO updated = walletService.updatePin(userId, request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Đã cập nhật mã PIN ví thành công!");
            resp.put("wallet", updated);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            log.error("Lỗi cập nhật mã PIN user {}: {}", userId, e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi cập nhật mã PIN: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }
}
