package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.AdminTransactionDTO.*;
import vn.edu.hcmuaf.fit.springboot.service.AdminTransactionService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping({"/api/admin/transactions", "/api/public/admin/transactions"})
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminTransactionController {

    private final AdminTransactionService adminTransactionService;

    @GetMapping
    public ResponseEntity<TransactionResponse> getTransactions(
            @RequestParam(name = "status", defaultValue = "all") String status,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "gateway", defaultValue = "all") String gateway,
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        return ResponseEntity.ok(adminTransactionService.getTransactions(status, search, gateway, page, limit));
    }

    @GetMapping("/stats")
    public ResponseEntity<FinancialStats> getFinancialStats() {
        return ResponseEntity.ok(adminTransactionService.getFinancialStats());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateTransactionStatus(
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest request) {
        try {
            return ResponseEntity.ok(adminTransactionService.updateTransactionStatus(id, request));
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
