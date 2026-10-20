package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.Voucher;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.VoucherRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AdminVoucherController - Quản lý toàn bộ mã giảm giá trong hệ thống dành cho Admin.
 * Cung cấp: thống kê, danh sách, tạo mới, chỉnh sửa, xóa, bật/tắt trạng thái,
 * và duyệt / từ chối yêu cầu mã giảm giá từ chủ homestay.
 */
@RestController
@RequestMapping({"/api/admin/vouchers", "/api/public/admin/vouchers"})
@CrossOrigin(origins = "*")
@Slf4j
public class AdminVoucherController {

    private final VoucherRepository voucherRepository;
    private final HomestayRepository homestayRepository;

    public AdminVoucherController(VoucherRepository voucherRepository, HomestayRepository homestayRepository) {
        this.voucherRepository = voucherRepository;
        this.homestayRepository = homestayRepository;
    }

    private static final DateTimeFormatter DTF = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ─────────────────────────────────────────────────────────────────────────
    // 1. THỐNG KÊ TỔNG QUAN
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Lấy thống kê KPI tổng quan mã giảm giá cho trang admin
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<Voucher> all = voucherRepository.findAll();
        LocalDate today = LocalDate.now();

        long total = all.stream().filter(v -> !"PENDING".equalsIgnoreCase(v.getStatus())).count();
        long pending = all.stream().filter(v -> "PENDING".equalsIgnoreCase(v.getStatus())).count();
        long rejected = all.stream().filter(v -> "REJECTED".equalsIgnoreCase(v.getStatus())).count();
        long active = all.stream()
                .filter(v -> "ACTIVE".equalsIgnoreCase(v.getStatus())
                        && (v.getExpiryDate() == null || !v.getExpiryDate().isBefore(today)))
                .count();
        long expired = all.stream()
                .filter(v -> !"PENDING".equalsIgnoreCase(v.getStatus())
                        && !"REJECTED".equalsIgnoreCase(v.getStatus())
                        && v.getExpiryDate() != null && v.getExpiryDate().isBefore(today))
                .count();
        long disabled = all.stream()
                .filter(v -> "DISABLED".equalsIgnoreCase(v.getStatus()))
                .count();
        long totalUsed = all.stream()
                .mapToLong(v -> v.getUsedCount() != null ? v.getUsedCount() : 0)
                .sum();

        // Tính tổng chi phí giảm giá ước tính
        BigDecimal totalDiscountCost = all.stream()
                .map(v -> {
                    int used = v.getUsedCount() != null ? v.getUsedCount() : 0;
                    if (used == 0) return BigDecimal.ZERO;
                    if ("PERCENT".equalsIgnoreCase(v.getDiscountType())) {
                        BigDecimal singleDisc = BigDecimal.valueOf(1500000)
                                .multiply(v.getValue() != null ? v.getValue() : BigDecimal.ZERO)
                                .divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.HALF_UP);
                        if (v.getMaxDiscount() != null && v.getMaxDiscount().compareTo(BigDecimal.ZERO) > 0) {
                            singleDisc = singleDisc.min(v.getMaxDiscount());
                        }
                        return singleDisc.multiply(BigDecimal.valueOf(used));
                    } else {
                        return (v.getValue() != null ? v.getValue() : BigDecimal.ZERO)
                                .multiply(BigDecimal.valueOf(used));
                    }
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("pending", pending);
        stats.put("rejected", rejected);
        stats.put("active", active);
        stats.put("expired", expired);
        stats.put("disabled", disabled);
        stats.put("totalUsed", totalUsed);
        stats.put("totalDiscountCost", totalDiscountCost);
        return ResponseEntity.ok(stats);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. DANH SÁCH MÃ GIẢM GIÁ
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Lấy danh sách toàn bộ mã giảm giá với lọc theo trạng thái, loại, keyword
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllVouchers(
            @RequestParam(value = "status", defaultValue = "all") String status,
            @RequestParam(value = "type", defaultValue = "all") String type,
            @RequestParam(value = "keyword", required = false) String keyword
    ) {
        List<Voucher> vouchers = voucherRepository.findAll();
        LocalDate today = LocalDate.now();

        // Map homestay name
        Map<Long, String> hsNameMap = homestayRepository.findAll().stream()
                .filter(h -> h.getId() != null)
                .collect(Collectors.toMap(Homestay::getId, h -> h.getName() != null ? h.getName() : "Không rõ",
                        (a, b) -> a));

        // Filter
        List<Map<String, Object>> result = vouchers.stream()
                .filter(v -> {
                    // Filter by status
                    if (!"all".equalsIgnoreCase(status)) {
                        String vStatus = resolveStatus(v, today);
                        if (!status.equalsIgnoreCase(vStatus)) return false;
                    }
                    // Filter by type
                    if (!"all".equalsIgnoreCase(type)) {
                        String vType = "PERCENT".equalsIgnoreCase(v.getDiscountType()) ? "percent" : "amount";
                        if (!type.equalsIgnoreCase(vType)) return false;
                    }
                    // Filter by keyword
                    if (keyword != null && !keyword.isBlank()) {
                        String kw = keyword.trim().toLowerCase();
                        String code = v.getCode() != null ? v.getCode().toLowerCase() : "";
                        String hsName = v.getHomestayId() != null
                                ? hsNameMap.getOrDefault(v.getHomestayId(), "").toLowerCase()
                                : "";
                        return code.contains(kw) || hsName.contains(kw);
                    }
                    return true;
                })
                .map(v -> mapVoucherToResponse(v, hsNameMap, today))
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2.1 DANH SÁCH MÃ GIẢM GIÁ ĐANG CHỜ DUYỆT (PENDING)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Lấy danh sách mã giảm giá đang chờ duyệt (status = PENDING)
     * Đặt TRƯỚC mapping /{id} để tránh bị bắt nhầm thành ID
     */
    @GetMapping("/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingVouchers() {
        List<Voucher> pending = voucherRepository.findAll().stream()
                .filter(v -> "PENDING".equalsIgnoreCase(v.getStatus()))
                .collect(Collectors.toList());
        Map<Long, String> hsNameMap = buildHsNameMap();
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> result = pending.stream()
                .map(v -> mapVoucherToResponse(v, hsNameMap, today))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    /**
     * Lấy chi tiết một mã giảm giá theo ID (chỉ nhận số)
     */
    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<?> getVoucherById(@PathVariable Long id) {
        Optional<Voucher> opt = voucherRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy mã giảm giá"));
        }
        Map<Long, String> hsNameMap = buildHsNameMap();
        return ResponseEntity.ok(mapVoucherToResponse(opt.get(), hsNameMap, LocalDate.now()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. TẠO MÃ GIẢM GIÁ MỚI (Admin phát hành)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Admin tạo mã giảm giá mới cho hệ thống hoặc gắn vào một homestay cụ thể
     */
    @PostMapping
    @CacheEvict(value = "publicVouchers", allEntries = true)
    public ResponseEntity<?> createVoucher(@RequestBody Map<String, Object> body) {
        try {
            String code = getString(body, "code");
            if (code == null || code.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Mã voucher không được để trống"));
            }
            code = code.trim().toUpperCase();

            if (voucherRepository.findByCodeIgnoreCase(code).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("success", false,
                        "message", "Mã giảm giá \"" + code + "\" đã tồn tại trên hệ thống!"));
            }

            Voucher v = new Voucher();
            v.setCode(code);

            // Homestay ID (null = áp dụng toàn sàn)
            Object hsIdRaw = body.get("homestayId");
            if (hsIdRaw != null && !hsIdRaw.toString().isBlank() && !"null".equals(hsIdRaw.toString())) {
                try {
                    v.setHomestayId(Long.parseLong(hsIdRaw.toString()));
                } catch (NumberFormatException ignored) {}
            }

            String discountType = getString(body, "discountType");
            v.setDiscountType("percent".equalsIgnoreCase(discountType) ? "PERCENT" : "AMOUNT");

            v.setValue(parseBigDecimal(body.get("value")));
            v.setMinOrderValue(parseBigDecimal(body.get("minOrderValue")));
            v.setMaxDiscount(parseBigDecimal(body.get("maxDiscount")));
            v.setUsageLimit(parseInteger(body.get("usageLimit"), 100));
            v.setUsedCount(0);

            String startStr = getString(body, "startDate");
            String endStr = getString(body, "expiryDate");
            v.setStartDate(parseDate(startStr, LocalDate.now()));
            v.setExpiryDate(parseDate(endStr, LocalDate.now().plusMonths(1)));
            v.setStatus("ACTIVE");

            Voucher saved = voucherRepository.save(v);
            Map<Long, String> hsNameMap = buildHsNameMap();
            return ResponseEntity.ok(mapVoucherToResponse(saved, hsNameMap, LocalDate.now()));

        } catch (Exception e) {
            log.error("Lỗi tạo voucher admin: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Lỗi tạo mã giảm giá: " + e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. CẬP NHẬT MÃ GIẢM GIÁ
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Admin chỉnh sửa thông tin mã giảm giá
     */
    @PutMapping("/{id}")
    @CacheEvict(value = "publicVouchers", allEntries = true)
    public ResponseEntity<?> updateVoucher(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<Voucher> opt = voucherRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy mã giảm giá"));
        }

        try {
            Voucher v = opt.get();

            String newCode = getString(body, "code");
            if (newCode != null && !newCode.isBlank()) {
                newCode = newCode.trim().toUpperCase();
                if (!newCode.equalsIgnoreCase(v.getCode())) {
                    if (voucherRepository.findByCodeIgnoreCase(newCode).isPresent()) {
                        return ResponseEntity.badRequest().body(Map.of("success", false,
                                "message", "Mã giảm giá \"" + newCode + "\" đã tồn tại!"));
                    }
                    v.setCode(newCode);
                }
            }

            Object hsIdRaw = body.get("homestayId");
            if (hsIdRaw != null) {
                if ("null".equals(hsIdRaw.toString()) || hsIdRaw.toString().isBlank()) {
                    v.setHomestayId(null);
                } else {
                    try { v.setHomestayId(Long.parseLong(hsIdRaw.toString())); } catch (NumberFormatException ignored) {}
                }
            }

            String discountType = getString(body, "discountType");
            if (discountType != null) {
                v.setDiscountType("percent".equalsIgnoreCase(discountType) ? "PERCENT" : "AMOUNT");
            }

            if (body.containsKey("value")) v.setValue(parseBigDecimal(body.get("value")));
            if (body.containsKey("minOrderValue")) v.setMinOrderValue(parseBigDecimal(body.get("minOrderValue")));
            if (body.containsKey("maxDiscount")) v.setMaxDiscount(parseBigDecimal(body.get("maxDiscount")));
            if (body.containsKey("usageLimit")) v.setUsageLimit(parseInteger(body.get("usageLimit"), v.getUsageLimit()));

            String startStr = getString(body, "startDate");
            String endStr = getString(body, "expiryDate");
            if (startStr != null) v.setStartDate(parseDate(startStr, v.getStartDate()));
            if (endStr != null) v.setExpiryDate(parseDate(endStr, v.getExpiryDate()));

            String statusStr = getString(body, "status");
            if (statusStr != null) {
                v.setStatus("ACTIVE".equalsIgnoreCase(statusStr) ? "ACTIVE" : "DISABLED");
            }

            Voucher saved = voucherRepository.save(v);
            Map<Long, String> hsNameMap = buildHsNameMap();
            return ResponseEntity.ok(mapVoucherToResponse(saved, hsNameMap, LocalDate.now()));

        } catch (Exception e) {
            log.error("Lỗi cập nhật voucher {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Lỗi cập nhật: " + e.getMessage()));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. BẬT / TẮT TRẠNG THÁI
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Toggle trạng thái ACTIVE <-> DISABLED
     */
    @RequestMapping(value = "/{id}/toggle", method = {RequestMethod.PATCH, RequestMethod.PUT, RequestMethod.POST})
    @CacheEvict(value = "publicVouchers", allEntries = true)
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        Optional<Voucher> opt = voucherRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy mã giảm giá"));
        }
        Voucher v = opt.get();
        String next = "ACTIVE".equalsIgnoreCase(v.getStatus()) ? "DISABLED" : "ACTIVE";
        v.setStatus(next);
        voucherRepository.save(v);
        Map<Long, String> hsNameMap = buildHsNameMap();
        return ResponseEntity.ok(mapVoucherToResponse(v, hsNameMap, LocalDate.now()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. DUYỆT / TỪ CHỐI MÃ GIẢM GIÁ TỪ CHỦ HOMESTAY
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Admin duyệt mã giảm giá (PENDING -> ACTIVE)
     */
    @PostMapping("/{id:[0-9]+}/approve")
    @CacheEvict(value = "publicVouchers", allEntries = true)
    public ResponseEntity<?> approveVoucher(@PathVariable Long id) {
        Optional<Voucher> opt = voucherRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy mã giảm giá"));
        }
        Voucher v = opt.get();
        if (!"PENDING".equalsIgnoreCase(v.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("success", false,
                    "message", "Chỉ có thể duyệt mã đang ở trạng thái chờ duyệt (PENDING)"));
        }
        v.setStatus("ACTIVE");
        voucherRepository.save(v);
        Map<Long, String> hsNameMap = buildHsNameMap();
        log.info("Admin đã DUYỆT mã giảm giá ID={} code={}", id, v.getCode());
        return ResponseEntity.ok(mapVoucherToResponse(v, hsNameMap, LocalDate.now()));
    }

    /**
     * Admin từ chối mã giảm giá (PENDING -> DISABLED)
     */
    @PostMapping("/{id:[0-9]+}/reject")
    @CacheEvict(value = "publicVouchers", allEntries = true)
    public ResponseEntity<?> rejectVoucher(@PathVariable Long id) {
        Optional<Voucher> opt = voucherRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy mã giảm giá"));
        }
        Voucher v = opt.get();
        if (!"PENDING".equalsIgnoreCase(v.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("success", false,
                    "message", "Chỉ có thể từ chối mã đang ở trạng thái chờ duyệt (PENDING)"));
        }
        v.setStatus("REJECTED");
        voucherRepository.save(v);
        Map<Long, String> hsNameMap = buildHsNameMap();
        log.info("Admin đã TỪ CHỐI mã giảm giá ID={} code={}", id, v.getCode());
        return ResponseEntity.ok(mapVoucherToResponse(v, hsNameMap, LocalDate.now()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. XÓA MÃ GIẢM GIÁ
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Xóa mã giảm giá khỏi hệ thống (chỉ khi chưa có ai dùng hoặc admin override)
     */
    @DeleteMapping("/{id}")
    @CacheEvict(value = "publicVouchers", allEntries = true)
    public ResponseEntity<?> deleteVoucher(@PathVariable Long id) {
        if (!voucherRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy mã giảm giá"));
        }
        voucherRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa mã giảm giá thành công"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPER METHODS
    // ─────────────────────────────────────────────────────────────────────────

    private Map<Long, String> buildHsNameMap() {
        return homestayRepository.findAll().stream()
                .filter(h -> h.getId() != null)
                .collect(Collectors.toMap(Homestay::getId, h -> h.getName() != null ? h.getName() : "Không rõ",
                        (a, b) -> a));
    }

    private String resolveStatus(Voucher v, LocalDate today) {
        if ("PENDING".equalsIgnoreCase(v.getStatus())) return "pending";
        if ("REJECTED".equalsIgnoreCase(v.getStatus())) return "rejected";
        if ("DISABLED".equalsIgnoreCase(v.getStatus())) return "disabled";
        if (v.getExpiryDate() != null && v.getExpiryDate().isBefore(today)) return "expired";
        if (v.getStartDate() != null && v.getStartDate().isAfter(today)) return "upcoming";
        return "active";
    }

    private Map<String, Object> mapVoucherToResponse(Voucher v, Map<Long, String> hsNameMap, LocalDate today) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", v.getId());
        m.put("ownerId", v.getOwnerId());
        m.put("code", v.getCode());
        m.put("homestayId", v.getHomestayId());
        m.put("homestayName", v.getHomestayId() != null
                ? hsNameMap.getOrDefault(v.getHomestayId(), "Không rõ")
                : "Toàn bộ hệ thống YÊN");
        m.put("discountType", "PERCENT".equalsIgnoreCase(v.getDiscountType()) ? "percent" : "amount");
        m.put("value", v.getValue());
        m.put("minOrderValue", v.getMinOrderValue());
        m.put("maxDiscount", v.getMaxDiscount());
        m.put("usageLimit", v.getUsageLimit());
        m.put("usedCount", v.getUsedCount() != null ? v.getUsedCount() : 0);
        m.put("startDate", v.getStartDate() != null ? v.getStartDate().toString() : null);
        m.put("expiryDate", v.getExpiryDate() != null ? v.getExpiryDate().toString() : null);
        m.put("startDateFormatted", v.getStartDate() != null ? v.getStartDate().format(DTF) : "-");
        m.put("expiryDateFormatted", v.getExpiryDate() != null ? v.getExpiryDate().format(DTF) : "-");
        m.put("status", resolveStatus(v, today));
        m.put("rawStatus", v.getStatus());
        // Usage percentage
        int limit = v.getUsageLimit() != null && v.getUsageLimit() > 0 ? v.getUsageLimit() : 100;
        int used = v.getUsedCount() != null ? v.getUsedCount() : 0;
        m.put("usagePercent", Math.min(100, (int) ((used * 100.0) / limit)));
        return m;
    }

    private String getString(Map<String, Object> body, String key) {
        Object val = body.get(key);
        if (val == null) return null;
        String s = val.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private BigDecimal parseBigDecimal(Object val) {
        if (val == null) return BigDecimal.ZERO;
        try { return new BigDecimal(val.toString()); } catch (Exception e) { return BigDecimal.ZERO; }
    }

    private Integer parseInteger(Object val, Integer defaultVal) {
        if (val == null) return defaultVal;
        try { return Integer.parseInt(val.toString()); } catch (Exception e) { return defaultVal; }
    }

    private LocalDate parseDate(String dateStr, LocalDate fallback) {
        if (dateStr == null || dateStr.isBlank()) return fallback;
        try { return LocalDate.parse(dateStr); } catch (Exception e) { return fallback; }
    }
}
