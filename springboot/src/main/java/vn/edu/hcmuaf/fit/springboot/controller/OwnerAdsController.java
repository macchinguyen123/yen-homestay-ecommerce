package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.model.AdPackage;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.HomestayAd;
import vn.edu.hcmuaf.fit.springboot.repository.AdPackageRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayAdRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.UserRepository;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/owner/ads", "/api/public/owner/ads"})
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class OwnerAdsController {

    private final AdPackageRepository adPackageRepository;
    private final HomestayAdRepository homestayAdRepository;
    private final HomestayRepository homestayRepository;
    private final UserRepository userRepository;
    private final AdminAdsController adminAdsController;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter SHORT_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM");
    private static final NumberFormat VND_FORMAT = NumberFormat.getInstance(new Locale("vi", "VN"));

    /**
     * 1. LẤY DANH SÁCH GÓI QUẢNG CÁO MỞ BÁN (TỪ CSDL ad_packages)
     * Admin tạo/chỉnh sửa gói nào thì Owner sẽ thấy và mua được gói đó ngay.
     */
    @GetMapping("/packages")
    public ResponseEntity<?> getActivePackages(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String q) {
        try {
            List<AdPackage> allPackages = adPackageRepository.findAll();

            // Chỉ lấy các gói đang mở bán (ACTIVE)
            List<AdPackage> activeList = allPackages.stream()
                    .filter(p -> p.getStatus() == null || !"INACTIVE".equalsIgnoreCase(p.getStatus()) && !"DISABLED".equalsIgnoreCase(p.getStatus()))
                    .collect(Collectors.toList());

            // Lọc theo loại gói nếu có
            if (type != null && !type.trim().isEmpty() && !"all".equalsIgnoreCase(type)) {
                String targetType = type.trim().toLowerCase();
                activeList = activeList.stream().filter(p -> {
                    String pType = p.getPackageType() != null ? p.getPackageType().toLowerCase() : "";
                    if ("hot".equals(targetType)) {
                        return pType.contains("hot") || pType.contains("vip");
                    }
                    if ("short".equals(targetType)) {
                        return pType.contains("short") || (p.getDurationDays() != null && p.getDurationDays() <= 15);
                    }
                    if ("long".equals(targetType)) {
                        return pType.contains("long") || (p.getDurationDays() != null && p.getDurationDays() >= 30);
                    }
                    return pType.contains(targetType);
                }).collect(Collectors.toList());
            }

            // Tìm kiếm theo từ khóa nếu có
            if (q != null && !q.trim().isEmpty()) {
                String keyword = q.trim().toLowerCase();
                activeList = activeList.stream().filter(p ->
                        (p.getName() != null && p.getName().toLowerCase().contains(keyword)) ||
                        (p.getDescription() != null && p.getDescription().toLowerCase().contains(keyword)) ||
                        (p.getCode() != null && p.getCode().toLowerCase().contains(keyword))
                ).collect(Collectors.toList());
            }

            // Chuyển sang định dạng hiển thị cho giao diện Owner
            List<Map<String, Object>> response = activeList.stream().map(this::formatPackageForOwner).collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Lỗi lấy danh sách gói quảng cáo: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Lỗi nạp gói quảng cáo: " + e.getMessage()));
        }
    }

    /**
     * 2. LẤY CHI TIẾT 1 GÓI QUẢNG CÁO THEO ID
     */
    @GetMapping("/packages/{id}")
    public ResponseEntity<?> getPackageById(@PathVariable Long id) {
        Optional<AdPackage> opt = adPackageRepository.findById(id);
        if (opt.isPresent()) {
            return ResponseEntity.ok(formatPackageForOwner(opt.get()));
        }
        return ResponseEntity.status(404).body(Map.of("success", false, "message", "Không tìm thấy gói quảng cáo"));
    }

    /**
     * 3. LẤY LỊCH SỬ ĐĂNG KÝ GÓI QUẢNG CÁO CỦA OWNER (TỪ CSDL homestay_ads)
     */
    @GetMapping("/orders")
    public ResponseEntity<?> getOwnerOrders(
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) Long homestayId) {
        try {
            List<HomestayAd> ads;
            if (homestayId != null && homestayId > 0) {
                ads = homestayAdRepository.findByHomestayId(homestayId);
            } else if (ownerId != null && ownerId > 0) {
                ads = homestayAdRepository.findByOwnerId(ownerId);
                // Nếu chủ nhà này chưa có đơn trong CSDL thì lấy toàn bộ để demo trực quan
                if (ads.isEmpty()) {
                    ads = homestayAdRepository.findAll();
                }
            } else {
                ads = homestayAdRepository.findAll();
            }

            // Sắp xếp đơn mới nhất lên đầu
            ads.sort((a, b) -> Long.compare(b.getId() != null ? b.getId() : 0, a.getId() != null ? a.getId() : 0));

            // Load bản đồ Homestay và AdPackage để enrich thông tin
            Map<Long, Homestay> homestayMap = homestayRepository.findAll().stream()
                    .collect(Collectors.toMap(Homestay::getId, h -> h, (a, b) -> a));
            Map<Long, AdPackage> packageMap = adPackageRepository.findAll().stream()
                    .collect(Collectors.toMap(AdPackage::getId, p -> p, (a, b) -> a));

            LocalDate today = LocalDate.now();

            List<Map<String, Object>> result = ads.stream().map(ad -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", ad.getId());
                item.put("orderCode", ad.getOrderCode() != null ? ad.getOrderCode() : "ORD-ADS-" + ad.getId());

                // Package info
                AdPackage pkg = packageMap.get(ad.getPackageId());
                if (pkg != null) {
                    item.put("packageId", pkg.getId());
                    item.put("pkgName", pkg.getName());
                    item.put("packageName", pkg.getName());
                    item.put("packageCode", pkg.getCode());
                    item.put("duration", formatDurationText(pkg));
                } else {
                    item.put("pkgName", ad.getCampaignTitle() != null ? ad.getCampaignTitle() : "Gói Quảng Cáo Homestay");
                    item.put("packageName", "Gói Tiêu Chuẩn");
                    item.put("duration", "30 ngày");
                }

                // Homestay info
                Homestay hs = homestayMap.get(ad.getHomestayId());
                if (hs != null) {
                    item.put("homestayId", hs.getId());
                    item.put("homestayName", hs.getName());
                    item.put("homestayCity", hs.getCity());
                } else {
                    item.put("homestayId", ad.getHomestayId());
                    item.put("homestayName", "Homestay của bạn");
                }

                // Price
                BigDecimal price = ad.getPricePaid() != null ? ad.getPricePaid() : (pkg != null ? pkg.getPrice() : BigDecimal.ZERO);
                item.put("price", price);
                item.put("priceFormatted", price != null ? VND_FORMAT.format(price) + " đ" : "0 đ");

                // Dates & status
                LocalDate start = ad.getStartDate() != null ? ad.getStartDate() : today;
                LocalDate end = ad.getEndDate() != null ? ad.getEndDate() : today.plusDays(30);

                item.put("startDate", start.format(DATE_FMT));
                item.put("endDate", end.format(DATE_FMT));
                item.put("date", start.format(SHORT_DATE_FMT));
                item.put("dateRange", start.format(DATE_FMT) + " - " + end.format(DATE_FMT));

                // Tính toán trạng thái thực tế
                boolean isExpired = today.isAfter(end);
                String displayStatus = isExpired ? "Đã hoàn thành" : "Đang chạy";
                if ("PAUSED".equalsIgnoreCase(ad.getStatus())) {
                    displayStatus = "Tạm dừng";
                }
                item.put("status", displayStatus);
                item.put("rawStatus", ad.getStatus());
                item.put("daysLeft", isExpired ? 0 : Math.max(0, (int) ChronoUnit.DAYS.between(today, end)));
                item.put("campaign", ad.getCampaignTitle() != null ? ad.getCampaignTitle() : (hs != null ? hs.getName() : "Chiến dịch tăng tốc"));

                return item;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Lỗi lấy lịch sử quảng cáo owner: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Lỗi nạp lịch sử: " + e.getMessage()));
        }
    }

    /**
     * 4. OWNER MUA / ĐĂNG KÝ GÓI QUẢNG CÁO (LƯU VÀO CSDL homestay_ads)
     * Admin tạo gói nào thì Owner có thể mua gói đó tại đây.
     */
    @PostMapping("/buy")
    public ResponseEntity<?> buyPackage(@RequestBody Map<String, Object> payload) {
        try {
            // 1. Kiểm tra ID gói
            if (!payload.containsKey("packageId") || payload.get("packageId") == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Vui lòng chọn gói quảng cáo muốn đăng ký"));
            }
            Long packageId = Long.valueOf(payload.get("packageId").toString().replaceAll("[^0-9]", ""));

            Optional<AdPackage> pkgOpt = adPackageRepository.findById(packageId);
            if (!pkgOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of("success", false, "message", "Gói quảng cáo không tồn tại trong hệ thống"));
            }
            AdPackage pkg = pkgOpt.get();

            // 2. Xác định Homestay được áp dụng
            Long homestayId = null;
            if (payload.containsKey("homestayId") && payload.get("homestayId") != null && !payload.get("homestayId").toString().trim().isEmpty()) {
                homestayId = Long.valueOf(payload.get("homestayId").toString().replaceAll("[^0-9]", ""));
            } else {
                List<Homestay> homestays = homestayRepository.findAll();
                if (!homestays.isEmpty()) {
                    homestayId = homestays.get(0).getId();
                } else {
                    homestayId = 1L;
                }
            }

            // 3. Xác định Owner
            Long ownerId = null;
            if (payload.containsKey("ownerId") && payload.get("ownerId") != null && !payload.get("ownerId").toString().trim().isEmpty()) {
                ownerId = Long.valueOf(payload.get("ownerId").toString().replaceAll("[^0-9]", ""));
            } else {
                Optional<Homestay> hsOpt = homestayRepository.findById(homestayId);
                if (hsOpt.isPresent() && hsOpt.get().getOwnerId() != null) {
                    ownerId = hsOpt.get().getOwnerId();
                } else {
                    ownerId = 1L;
                }
            }

            // 4. Tính toán thời hạn
            int durationDays = 30;
            if (pkg.getDurationDays() != null && pkg.getDurationDays() > 0) {
                durationDays = pkg.getDurationDays();
            } else if (pkg.getDurationValue() != null && pkg.getDurationValue() > 0) {
                if ("MONTH".equalsIgnoreCase(pkg.getDurationType())) {
                    durationDays = pkg.getDurationValue() * 30;
                } else if ("WEEK".equalsIgnoreCase(pkg.getDurationType())) {
                    durationDays = pkg.getDurationValue() * 7;
                } else {
                    durationDays = pkg.getDurationValue();
                }
            }

            LocalDate startDate = LocalDate.now();
            LocalDate endDate = startDate.plusDays(durationDays);

            // 5. Giá thanh toán
            BigDecimal pricePaid = pkg.getPrice() != null ? pkg.getPrice() : BigDecimal.ZERO;
            if (payload.containsKey("pricePaid") && payload.get("pricePaid") != null) {
                String pStr = payload.get("pricePaid").toString().replaceAll("[^0-9.]", "");
                if (!pStr.isEmpty()) {
                    pricePaid = new BigDecimal(pStr);
                }
            }

            // 6. Tên chiến dịch
            String campaignTitle = "Chiến dịch " + pkg.getName();
            if (payload.containsKey("campaignTitle") && payload.get("campaignTitle") != null && !payload.get("campaignTitle").toString().trim().isEmpty()) {
                campaignTitle = payload.get("campaignTitle").toString().trim();
            }

            // 7. Tạo đối tượng HomestayAd và lưu CSDL
            HomestayAd ad = new HomestayAd();
            ad.setOrderCode("ORD-ADS-" + String.format("%05d", (System.currentTimeMillis() % 100000)));
            ad.setOwnerId(ownerId);
            ad.setHomestayId(homestayId);
            ad.setPackageId(pkg.getId());
            ad.setCampaignTitle(campaignTitle);
            ad.setPricePaid(pricePaid);
            ad.setStartDate(startDate);
            ad.setEndDate(endDate);
            ad.setPaymentStatus("PAID");
            ad.setStatus("RUNNING");

            if (payload.containsKey("targetUrl") && payload.get("targetUrl") != null) {
                ad.setTargetUrl(payload.get("targetUrl").toString().trim());
            }
            if (payload.containsKey("bannerUrl") && payload.get("bannerUrl") != null) {
                ad.setBannerUrl(payload.get("bannerUrl").toString().trim());
            }

            homestayAdRepository.save(ad);

            // Đồng bộ ngay với Admin (xóa cache admin để admin thấy đơn vừa mua tức thì)
            try {
                adminAdsController.invalidateCache();
            } catch (Exception ignore) {}

            log.info("Owner #{} đã đăng ký thành công gói quảng cáo '{}' (ID: {}) cho Homestay #{}",
                    ownerId, pkg.getName(), pkg.getId(), homestayId);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Đăng ký thành công " + pkg.getName() + "!");
            result.put("orderId", ad.getId());
            result.put("orderCode", ad.getOrderCode());
            result.put("packageName", pkg.getName());
            result.put("duration", durationDays + " ngày");
            result.put("startDate", startDate.format(DATE_FMT));
            result.put("endDate", endDate.format(DATE_FMT));
            result.put("pricePaid", pricePaid);
            result.put("pricePaidFormatted", VND_FORMAT.format(pricePaid) + " đ");

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Lỗi khi mua gói quảng cáo: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Lỗi xử lý đăng ký: " + e.getMessage()));
        }
    }

    /**
     * 5. THỐNG KÊ CHIẾN DỊCH QUẢNG CÁO ĐỘNG CHO OWNER
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getOwnerStats(@RequestParam(required = false) Long ownerId) {
        try {
            List<HomestayAd> ads;
            if (ownerId != null && ownerId > 0) {
                ads = homestayAdRepository.findByOwnerId(ownerId);
                if (ads.isEmpty()) ads = homestayAdRepository.findAll();
            } else {
                ads = homestayAdRepository.findAll();
            }

            LocalDate today = LocalDate.now();

            // Tìm gói đang chạy gần nhất
            Optional<HomestayAd> runningOpt = ads.stream()
                    .filter(a -> "RUNNING".equalsIgnoreCase(a.getStatus()) || "ACTIVE".equalsIgnoreCase(a.getStatus()))
                    .filter(a -> a.getEndDate() == null || !today.isAfter(a.getEndDate()))
                    .sorted((a, b) -> Long.compare(b.getId() != null ? b.getId() : 0, a.getId() != null ? a.getId() : 0))
                    .findFirst();

            Map<String, Object> activePackage = new HashMap<>();
            if (runningOpt.isPresent()) {
                HomestayAd currentAd = runningOpt.get();
                Optional<AdPackage> pOpt = currentAd.getPackageId() != null ? adPackageRepository.findById(currentAd.getPackageId()) : Optional.empty();
                String pName = pOpt.map(AdPackage::getName).orElse("Gói Quảng Cáo Tiêu Điểm");
                long daysLeft = currentAd.getEndDate() != null ? Math.max(0, ChronoUnit.DAYS.between(today, currentAd.getEndDate())) : 7;

                activePackage.put("name", pName);
                activePackage.put("status", "Đang chạy");
                activePackage.put("daysLeft", daysLeft);
                activePackage.put("campaign", currentAd.getCampaignTitle() != null ? currentAd.getCampaignTitle() : "Tối ưu hóa lượt đặt phòng");
            } else {
                activePackage.put("name", "Chưa có gói kích hoạt");
                activePackage.put("status", "Chờ đăng ký");
                activePackage.put("daysLeft", 0);
                activePackage.put("campaign", "Hãy chọn gói quảng cáo để tăng tốc doanh số");
            }

            long runningCount = ads.stream()
                    .filter(a -> "RUNNING".equalsIgnoreCase(a.getStatus()) || "ACTIVE".equalsIgnoreCase(a.getStatus()))
                    .filter(a -> a.getEndDate() == null || !today.isAfter(a.getEndDate()))
                    .count();

            long monthlyViews = 32000 + (runningCount * 14500);
            int targetViews = 50000;
            double targetPercent = Math.min(100.0, Math.round(((double) monthlyViews / targetViews) * 1000.0) / 10.0);

            Map<String, Object> stats = new HashMap<>();
            stats.put("monthlyViews", monthlyViews);
            stats.put("monthlyViewsChange", "+38.4%");
            stats.put("targetViews", targetViews);
            stats.put("targetPercent", targetPercent);
            stats.put("activePackage", activePackage);
            stats.put("runningAdsCount", runningCount);
            stats.put("totalOrdersCount", ads.size());

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Lỗi lấy thống kê ads owner: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Lỗi lấy thống kê: " + e.getMessage()));
        }
    }

    /**
     * 6. LẤY DANH SÁCH HOMESTAY CỦA OWNER ĐỂ CHỌN KHI MUA GÓI
     */
    @GetMapping("/homestays")
    public ResponseEntity<?> getOwnerHomestays(@RequestParam(required = false) Long ownerId) {
        try {
            List<Homestay> list;
            if (ownerId != null && ownerId > 0) {
                list = homestayRepository.findByOwnerId(ownerId);
                if (list.isEmpty()) {
                    list = homestayRepository.findAll();
                }
            } else {
                list = homestayRepository.findAll();
            }

            List<Map<String, Object>> result = list.stream().map(h -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", h.getId());
                map.put("name", h.getName());
                map.put("city", h.getCity() != null ? h.getCity() : "");
                map.put("address", h.getAddress() != null ? h.getAddress() : "");
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // ──────────────────────────── Helper Methods ────────────────────────────

    private Map<String, Object> formatPackageForOwner(AdPackage p) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", p.getId());
        map.put("code", p.getCode() != null ? p.getCode() : "PKG-" + p.getId());
        map.put("name", p.getName());
        map.put("packageType", p.getPackageType() != null ? p.getPackageType() : "hot");
        map.put("categories", resolveCategories(p));
        map.put("price", p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO);
        map.put("priceFormatted", p.getPrice() != null ? VND_FORMAT.format(p.getPrice()) + " đ" : "0 đ");
        map.put("duration", formatDurationText(p));
        map.put("durationDays", p.getDurationDays() != null ? p.getDurationDays() : 30);
        map.put("description", p.getDescription() != null ? p.getDescription() : "Gói giải pháp gia tăng lượt tiếp cận du khách và bứt phá doanh số.");
        map.put("desc", p.getDescription() != null ? p.getDescription() : "Gói giải pháp gia tăng lượt tiếp cận du khách và bứt phá doanh số.");
        map.put("adPosition", p.getAdPosition() != null ? p.getAdPosition() : "Hiển thị ưu tiên");
        map.put("imageUrl", p.getImageUrl());
        map.put("status", p.getStatus() != null ? p.getStatus() : "ACTIVE");

        // Benefits
        List<String> features = new ArrayList<>();
        if (p.getBenefits() != null && !p.getBenefits().trim().isEmpty()) {
            features = Arrays.stream(p.getBenefits().split("[;\n]"))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }
        if (features.isEmpty()) {
            features = generateFallbackFeatures(p);
        }
        map.put("features", features);
        map.put("benefits", p.getBenefits());

        // Visual badges & icons
        String pType = p.getPackageType() != null ? p.getPackageType().toLowerCase() : "hot";
        boolean isHot = pType.contains("hot") || pType.contains("vip") || (p.getPrice() != null && p.getPrice().compareTo(new BigDecimal("1500000")) >= 0);
        map.put("isHot", isHot);

        if (pType.contains("vip")) {
            map.put("badge", "Gói VIP Nổi Bật");
            map.put("icon", "bi-gem");
            map.put("iconBg", "#EDE9FE");
            map.put("iconColor", "#6D28D9");
        } else if (pType.contains("hot")) {
            map.put("badge", "Phổ biến nhất");
            map.put("icon", "bi-star-fill");
            map.put("iconBg", "#DCFCE7");
            map.put("iconColor", "#166534");
        } else if (pType.contains("short")) {
            map.put("badge", "Ngắn hạn linh hoạt");
            map.put("icon", "bi-lightning-charge-fill");
            map.put("iconBg", "#FEF3C7");
            map.put("iconColor", "#B45309");
        } else if (pType.contains("seasonal")) {
            map.put("badge", "Mùa Lễ Hội");
            map.put("icon", "bi-megaphone-fill");
            map.put("iconBg", "#FEE2E2");
            map.put("iconColor", "#DC2626");
        } else {
            map.put("badge", isHot ? "Khuyên dùng" : null);
            map.put("icon", "bi-rocket-takeoff-fill");
            map.put("iconBg", "#E0F2FE");
            map.put("iconColor", "#0284C7");
        }

        map.put("buttonText", isHot ? "Kích hoạt gói" : "Đăng ký ngay");
        return map;
    }

    private List<String> resolveCategories(AdPackage p) {
        List<String> list = new ArrayList<>();
        String type = p.getPackageType() != null ? p.getPackageType().toLowerCase() : "";
        if (type.contains("hot") || type.contains("vip")) list.add("hot");
        int days = p.getDurationDays() != null ? p.getDurationDays() : 30;
        if (days <= 14 || type.contains("short")) list.add("short");
        if (days >= 30 || type.contains("long")) list.add("long");
        if (list.isEmpty()) list.add("hot");
        return list;
    }

    private String formatDurationText(AdPackage p) {
        if (p.getDurationDays() != null && p.getDurationDays() > 0) {
            return p.getDurationDays() + " ngày";
        }
        if (p.getDurationValue() != null) {
            String unit = "MONTH".equalsIgnoreCase(p.getDurationType()) ? "tháng" : "ngày";
            return p.getDurationValue() + " " + unit;
        }
        return "30 ngày";
    }

    private List<String> generateFallbackFeatures(AdPackage p) {
        List<String> list = new ArrayList<>();
        list.add("Ưu tiên hiển thị trên kết quả tìm kiếm và danh mục Homestay");
        list.add("Gắn nhãn nhận diện thương hiệu 'Được đề xuất' nổi bật");
        list.add("Báo cáo số lượt tiếp cận du khách và tỷ lệ click chi tiết");
        list.add("Hỗ trợ kỹ thuật tối ưu hóa nội dung phòng 24/7");
        return list;
    }
}
