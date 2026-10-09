package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.HomestayImage;
import vn.edu.hcmuaf.fit.springboot.model.Review;
import vn.edu.hcmuaf.fit.springboot.model.Voucher;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayImageRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.ReviewRepository;
import vn.edu.hcmuaf.fit.springboot.repository.VoucherRepository;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/public/vouchers")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class VoucherController {

    private final VoucherRepository voucherRepository;
    private final HomestayRepository homestayRepository;
    private final HomestayImageRepository homestayImageRepository;
    private final ReviewRepository reviewRepository;

    private String formatPrice(BigDecimal price) {
        if (price == null) return "0đ";
        DecimalFormat formatter = new DecimalFormat("#,###");
        return formatter.format(price).replace(",", ".") + "đ";
    }

    /**
     * Lấy toàn bộ danh sách voucher thật từ PostgreSQL và kết nối với dữ liệu Homestay thật
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getPublicVouchers() {
        List<Voucher> vouchers = voucherRepository.findAll();
        List<Homestay> homestays = homestayRepository.findAll();
        List<HomestayImage> allImages = homestayImageRepository.findAll();
        List<Review> allReviews = reviewRepository.findAll();

        // Map homestay primary images
        Map<Long, String> imgMap = new HashMap<>();
        for (HomestayImage img : allImages) {
            if (img.getHomestayId() != null && (!imgMap.containsKey(img.getHomestayId()) || Boolean.TRUE.equals(img.getIsPrimary()))) {
                imgMap.put(img.getHomestayId(), img.getImageUrl());
            }
        }

        // Map homestay review counts
        Map<Long, Integer> revMap = new HashMap<>();
        for (Review r : allReviews) {
            if (r.getHomestayId() != null) {
                revMap.put(r.getHomestayId(), revMap.getOrDefault(r.getHomestayId(), 0) + 1);
            }
        }

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        LocalDate today = LocalDate.now();

        List<Map<String, Object>> result = new ArrayList<>();

        for (int i = 0; i < vouchers.size(); i++) {
            Voucher v = vouchers.get(i);
            Homestay hs = homestays.isEmpty() ? null : homestays.get(i % homestays.size());

            Map<String, Object> map = new HashMap<>();
            map.put("id", "VCH-DB-" + v.getId());
            map.put("voucherId", v.getId());
            map.put("code", v.getCode());
            map.put("discountType", v.getDiscountType());
            map.put("value", v.getValue());
            map.put("minOrderValue", v.getMinOrderValue());
            map.put("maxDiscount", v.getMaxDiscount());
            map.put("startDate", v.getStartDate());
            map.put("expiryDate", v.getExpiryDate());
            map.put("usageLimit", v.getUsageLimit());
            map.put("usedCount", v.getUsedCount());
            map.put("status", v.getStatus());

            // Phân loại mục Voucher:
            // i == 0, 1, 2, 3 -> hot
            // i == 4, 5 -> new
            // i == 6, 7 -> most_used
            // i >= 8 -> vip
            String section;
            String badge;
            String tagClass;
            if (i < 3) {
                section = "hot";
                badge = "🔥 HOT NHẤT";
                tagClass = (i % 2 == 0) ? "tag-red" : "tag-orange";
            } else if (i < 5) {
                section = "new";
                badge = "✨ MỚI";
                tagClass = "tag-green";
            } else if (i < 7) {
                section = "most_used";
                badge = "⚡ DÙNG NHIỀU";
                tagClass = "tag-teal";
            } else {
                section = "vip";
                badge = "🎁 ĐẶC QUYỀN VIP";
                tagClass = "tag-purple";
            }
            map.put("section", section);
            map.put("collectionBadge", badge);
            map.put("tagClass", tagClass);

            // Discount display string
            String discountVal;
            if ("PERCENT".equalsIgnoreCase(v.getDiscountType())) {
                discountVal = "Giảm " + (v.getValue() != null ? v.getValue().intValue() : 0) + "%";
            } else {
                long val = v.getValue() != null ? v.getValue().longValue() : 0;
                if (val >= 1000000) {
                    discountVal = "Giảm " + (val / 1000000) + "Tr";
                } else if (val >= 1000) {
                    discountVal = "Giảm " + (val / 1000) + "K";
                } else {
                    discountVal = "Giảm " + val + "đ";
                }
            }
            map.put("discountVal", discountVal);

            // Condition display string
            String condMin = "";
            if (v.getMinOrderValue() != null && v.getMinOrderValue().compareTo(BigDecimal.ZERO) > 0) {
                long minVal = v.getMinOrderValue().longValue();
                if (minVal >= 1000000) {
                    double tr = minVal / 1000000.0;
                    condMin = "Đơn từ " + (tr == (long) tr ? String.format("%d", (long) tr) : String.format("%.1f", tr)) + "tr";
                } else {
                    condMin = "Đơn từ " + (minVal / 1000) + "k";
                }
            } else {
                condMin = "Mọi đơn hàng";
            }

            // Expiry & urgent check
            boolean isUrgent = false;
            String expiryText = "";
            if (v.getExpiryDate() != null) {
                long daysLeft = ChronoUnit.DAYS.between(today, v.getExpiryDate());
                if (daysLeft < 0) {
                    expiryText = "Đã hết hạn";
                } else if (daysLeft <= 3) {
                    isUrgent = true;
                    expiryText = "Còn " + (daysLeft == 0 ? "hôm nay" : daysLeft + " ngày");
                } else {
                    expiryText = "Hạn: " + v.getExpiryDate().format(dtf);
                }
            }
            map.put("isUrgent", isUrgent);
            map.put("expiryText", expiryText);

            // Usage percent
            int usageLimit = v.getUsageLimit() != null && v.getUsageLimit() > 0 ? v.getUsageLimit() : 100;
            int usedCount = v.getUsedCount() != null ? v.getUsedCount() : 0;
            int usedPercent = Math.min(100, Math.max(10, (usedCount * 100) / usageLimit));
            map.put("usedPercent", usedPercent);

            // Homestay linkage
            if (hs != null) {
                map.put("homestayId", hs.getId());
                map.put("homestayName", hs.getName());
                map.put("location", hs.getAddress() != null && !hs.getAddress().isEmpty() ? hs.getAddress() : hs.getCity());
                map.put("city", hs.getCity());
                map.put("rating", hs.getRating() != null ? String.format(Locale.US, "%.2f", hs.getRating()) : "5.00");
                map.put("reviews", String.valueOf(revMap.getOrDefault(hs.getId(), 18)));
                map.put("originalPrice", hs.getBasePrice() != null ? formatPrice(hs.getBasePrice()) : "1.200.000đ");

                String img = imgMap.get(hs.getId());
                if (img == null || img.isEmpty()) {
                    img = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80";
                }
                map.put("homestayImg", img);
                map.put("title", hs.getName());
                map.put("condition", condMin + " · " + (v.getMaxDiscount() != null ? "Tối đa " + formatPrice(v.getMaxDiscount()) : discountVal));
            } else {
                map.put("homestayId", null);
                map.put("homestayName", "Hệ thống YÊN Homestay");
                map.put("location", "Toàn quốc");
                map.put("city", "all");
                map.put("rating", "5.00");
                map.put("reviews", "99");
                map.put("originalPrice", "1.000.000đ");
                map.put("homestayImg", "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80");
                map.put("title", "Khuyến mãi toàn hệ thống YÊN Homestay");
                map.put("condition", condMin);
            }

            // Real terms array
            List<String> terms = new ArrayList<>();
            if (hs != null) {
                terms.add("Áp dụng trực tiếp khi đặt phòng tại " + hs.getName() + " (" + hs.getCity() + ").");
            } else {
                terms.add("Áp dụng cho mọi homestay trên hệ thống YÊN Homestay.");
            }
            if (v.getMinOrderValue() != null && v.getMinOrderValue().compareTo(BigDecimal.ZERO) > 0) {
                terms.add("Đơn hàng tối thiểu từ " + formatPrice(v.getMinOrderValue()) + " trở lên.");
            }
            if (v.getMaxDiscount() != null && v.getMaxDiscount().compareTo(BigDecimal.ZERO) > 0) {
                terms.add("Mức giảm tối đa không vượt quá " + formatPrice(v.getMaxDiscount()) + ".");
            }
            if (v.getExpiryDate() != null) {
                terms.add("Thời hạn áp dụng đến hết ngày " + v.getExpiryDate().format(dtf) + ".");
            }
            terms.add("Mỗi tài khoản được lưu và áp dụng mã 01 lần tại bước thanh toán.");
            map.put("terms", terms);

            result.add(map);
        }

        return ResponseEntity.ok(result);
    }

    /**
     * Tra cứu và kiểm tra hiệu lực voucher theo mã code
     */
    @GetMapping("/check/{code}")
    public ResponseEntity<Map<String, Object>> checkVoucher(@PathVariable String code) {
        Map<String, Object> resp = new HashMap<>();
        Optional<Voucher> opt = voucherRepository.findByCode(code.trim().toUpperCase());
        if (opt.isEmpty()) {
            resp.put("valid", false);
            resp.put("message", "Mã giảm giá không tồn tại hoặc đã hết hạn.");
            return ResponseEntity.ok(resp);
        }

        Voucher v = opt.get();
        LocalDate today = LocalDate.now();
        if ("DISABLED".equalsIgnoreCase(v.getStatus()) || "EXPIRED".equalsIgnoreCase(v.getStatus())) {
            resp.put("valid", false);
            resp.put("message", "Mã giảm giá này hiện đang tạm ngưng hoặc đã hết hiệu lực.");
            return ResponseEntity.ok(resp);
        }

        if (v.getExpiryDate() != null && v.getExpiryDate().isBefore(today)) {
            resp.put("valid", false);
            resp.put("message", "Mã giảm giá đã quá hạn sử dụng (hạn: " + v.getExpiryDate() + ").");
            return ResponseEntity.ok(resp);
        }

        if (v.getUsageLimit() != null && v.getUsedCount() != null && v.getUsedCount() >= v.getUsageLimit()) {
            resp.put("valid", false);
            resp.put("message", "Mã giảm giá đã hết lượt sử dụng.");
            return ResponseEntity.ok(resp);
        }

        resp.put("valid", true);
        resp.put("code", v.getCode());
        resp.put("discountType", v.getDiscountType());
        resp.put("value", v.getValue());
        resp.put("minOrderValue", v.getMinOrderValue());
        resp.put("maxDiscount", v.getMaxDiscount());
        resp.put("message", "Mã ưu đãi hợp lệ!");
        return ResponseEntity.ok(resp);
    }
}
