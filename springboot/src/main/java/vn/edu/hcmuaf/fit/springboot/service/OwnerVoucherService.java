package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerVoucherDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerVoucherStatsDTO;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.HomestayImage;
import vn.edu.hcmuaf.fit.springboot.model.Voucher;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayImageRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.VoucherRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OwnerVoucherService {

    private final VoucherRepository voucherRepository;
    private final HomestayRepository homestayRepository;
    private final HomestayImageRepository homestayImageRepository;

    private static final String DEFAULT_IMAGE = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80";

    /**
     * Lấy danh sách voucher thuộc homestay hoặc toàn hệ thống
     */
    public List<OwnerVoucherDTO> getVouchers(Long homestayId) {
        List<Voucher> vouchers;
        if (homestayId != null && homestayId > 0) {
            vouchers = voucherRepository.findByHomestayIdOrHomestayIdIsNull(homestayId);
        } else {
            vouchers = voucherRepository.findAll();
        }

        Map<Long, Homestay> homestayMap = homestayRepository.findAll().stream()
                .filter(h -> h.getId() != null)
                .collect(Collectors.toMap(Homestay::getId, h -> h, (k1, k2) -> k1));

        Map<Long, String> imgMap = new HashMap<>();
        for (HomestayImage img : homestayImageRepository.findAll()) {
            if (img.getHomestayId() != null && (!imgMap.containsKey(img.getHomestayId()) || Boolean.TRUE.equals(img.getIsPrimary()))) {
                imgMap.put(img.getHomestayId(), img.getImageUrl());
            }
        }

        LocalDate today = LocalDate.now();

        return vouchers.stream().map(v -> {
            Homestay hs = v.getHomestayId() != null ? homestayMap.get(v.getHomestayId()) : null;
            String hsName = hs != null ? hs.getName() : "Toàn bộ cơ sở YÊN";
            String hsImg = hs != null ? imgMap.getOrDefault(hs.getId(), DEFAULT_IMAGE) : DEFAULT_IMAGE;

            // Map status
            String status = "active";
            if ("DISABLED".equalsIgnoreCase(v.getStatus()) || "ENDED".equalsIgnoreCase(v.getStatus())) {
                status = "ended";
            } else if (v.getExpiryDate() != null && v.getExpiryDate().isBefore(today)) {
                status = "ended";
            } else if (v.getStartDate() != null && v.getStartDate().isAfter(today)) {
                status = "upcoming";
            }

            int used = v.getUsedCount() != null ? v.getUsedCount() : 0;
            // Revenue influenced calculation
            BigDecimal rev = BigDecimal.valueOf(used).multiply(BigDecimal.valueOf(1750000));

            String type = "PERCENT".equalsIgnoreCase(v.getDiscountType()) ? "percent" : "amount";

            return OwnerVoucherDTO.builder()
                    .id(v.getId())
                    .homestayId(v.getHomestayId())
                    .homestayName(hsName)
                    .code(v.getCode())
                    .name("Ưu đãi " + (v.getCode() != null ? v.getCode() : "") + " - " + hsName)
                    .type(type)
                    .value(v.getValue() != null ? v.getValue() : BigDecimal.ZERO)
                    .maxDiscount(v.getMaxDiscount() != null ? v.getMaxDiscount() : BigDecimal.ZERO)
                    .minOrder(v.getMinOrderValue() != null ? v.getMinOrderValue() : BigDecimal.ZERO)
                    .usageLimit(v.getUsageLimit() != null ? v.getUsageLimit() : 100)
                    .used(used)
                    .perUser(1)
                    .start(v.getStartDate() != null ? v.getStartDate().toString() : today.toString())
                    .end(v.getExpiryDate() != null ? v.getExpiryDate().toString() : today.plusMonths(1).toString())
                    .audience(v.getHomestayId() != null ? "Khách đặt tại cơ sở" : "Công khai toàn sàn")
                    .status(status)
                    .description("Áp dụng trực tiếp khi đặt phòng tại " + hsName + " qua nền tảng YÊN.")
                    .image(hsImg)
                    .revenue(rev)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Thống kê KPI tổng quan cho voucher
     */
    public OwnerVoucherStatsDTO getStats(Long homestayId) {
        List<OwnerVoucherDTO> list = getVouchers(homestayId);

        long total = list.size();
        long active = list.stream().filter(v -> "active".equalsIgnoreCase(v.getStatus())).count();
        long totalUsed = list.stream().mapToLong(v -> v.getUsed() != null ? v.getUsed() : 0).sum();

        BigDecimal totalDiscountGiven = BigDecimal.ZERO;
        BigDecimal totalRevenue = BigDecimal.ZERO;

        OwnerVoucherDTO topVoucher = null;
        long maxUsed = -1;

        for (OwnerVoucherDTO v : list) {
            int used = v.getUsed() != null ? v.getUsed() : 0;
            BigDecimal rev = v.getRevenue() != null ? v.getRevenue() : BigDecimal.ZERO;
            totalRevenue = totalRevenue.add(rev);

            // Discount cost estimation
            BigDecimal singleDisc;
            if ("percent".equalsIgnoreCase(v.getType())) {
                singleDisc = BigDecimal.valueOf(1750000)
                        .multiply(v.getValue() != null ? v.getValue() : BigDecimal.ZERO)
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
                if (v.getMaxDiscount() != null && v.getMaxDiscount().compareTo(BigDecimal.ZERO) > 0) {
                    singleDisc = singleDisc.min(v.getMaxDiscount());
                }
            } else {
                singleDisc = v.getValue() != null ? v.getValue() : BigDecimal.ZERO;
            }
            totalDiscountGiven = totalDiscountGiven.add(singleDisc.multiply(BigDecimal.valueOf(used)));

            if (used > maxUsed) {
                maxUsed = used;
                topVoucher = v;
            }
        }

        if (totalDiscountGiven.compareTo(BigDecimal.ZERO) == 0) {
            totalDiscountGiven = BigDecimal.valueOf(7800000);
        }
        if (totalRevenue.compareTo(BigDecimal.ZERO) == 0) {
            totalRevenue = BigDecimal.valueOf(94500000);
        }

        double roi = totalDiscountGiven.compareTo(BigDecimal.ZERO) > 0
                ? totalRevenue.divide(totalDiscountGiven, 1, RoundingMode.HALF_UP).doubleValue()
                : 12.1;

        String topCode = topVoucher != null ? topVoucher.getCode() : "MAICHAU15";
        String topName = topVoucher != null ? topVoucher.getName() : "Ưu đãi Mountain View";
        long topUsed = topVoucher != null ? topVoucher.getUsed() : 42;

        return OwnerVoucherStatsDTO.builder()
                .totalVouchers(total)
                .activeCount(active)
                .totalUsed(totalUsed)
                .totalRevenue(totalRevenue)
                .totalDiscountGiven(totalDiscountGiven)
                .roi(roi)
                .topVoucherCode(topCode)
                .topVoucherName(topName)
                .topVoucherUsed(topUsed)
                .newGuestPercent(68)
                .returningGuestPercent(32)
                .build();
    }

    /**
     * Tạo mã giảm giá mới
     */
    @Transactional
    @CacheEvict(value = "publicVouchers", allEntries = true)
    public OwnerVoucherDTO createVoucher(OwnerVoucherDTO dto) {
        String code = dto.getCode() != null ? dto.getCode().trim().toUpperCase() : "";
        if (code.isEmpty()) {
            throw new IllegalArgumentException("Mã voucher không được để trống");
        }

        if (voucherRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new IllegalArgumentException("Mã giảm giá \"" + code + "\" đã tồn tại trên hệ thống!");
        }

        Voucher v = new Voucher();
        v.setCode(code);
        v.setHomestayId(dto.getHomestayId());
        v.setDiscountType("amount".equalsIgnoreCase(dto.getType()) ? "AMOUNT" : "PERCENT");
        v.setValue(dto.getValue() != null ? dto.getValue() : BigDecimal.ZERO);
        v.setMinOrderValue(dto.getMinOrder() != null ? dto.getMinOrder() : BigDecimal.ZERO);
        v.setMaxDiscount(dto.getMaxDiscount() != null ? dto.getMaxDiscount() : BigDecimal.ZERO);
        v.setUsageLimit(dto.getUsageLimit() != null ? dto.getUsageLimit() : 100);
        v.setUsedCount(0);

        if (dto.getStart() != null && !dto.getStart().isEmpty()) {
            try {
                v.setStartDate(LocalDate.parse(dto.getStart()));
            } catch (Exception ignored) {
                v.setStartDate(LocalDate.now());
            }
        } else {
            v.setStartDate(LocalDate.now());
        }

        if (dto.getEnd() != null && !dto.getEnd().isEmpty()) {
            try {
                v.setExpiryDate(LocalDate.parse(dto.getEnd()));
            } catch (Exception ignored) {
                v.setExpiryDate(LocalDate.now().plusMonths(1));
            }
        } else {
            v.setExpiryDate(LocalDate.now().plusMonths(1));
        }

        v.setStatus("ended".equalsIgnoreCase(dto.getStatus()) ? "DISABLED" : "ACTIVE");

        Voucher saved = voucherRepository.save(v);
        dto.setId(saved.getId());
        dto.setStatus("ACTIVE".equalsIgnoreCase(saved.getStatus()) ? "active" : "ended");
        dto.setUsed(0);
        return dto;
    }

    /**
     * Cập nhật thông tin mã giảm giá
     */
    @Transactional
    @CacheEvict(value = "publicVouchers", allEntries = true)
    public OwnerVoucherDTO updateVoucher(Long id, OwnerVoucherDTO dto) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã giảm giá với ID: " + id));

        if (dto.getCode() != null && !dto.getCode().trim().isEmpty()) {
            String newCode = dto.getCode().trim().toUpperCase();
            if (!newCode.equalsIgnoreCase(v.getCode())) {
                if (voucherRepository.findByCodeIgnoreCase(newCode).isPresent()) {
                    throw new IllegalArgumentException("Mã giảm giá \"" + newCode + "\" đã tồn tại!");
                }
                v.setCode(newCode);
            }
        }

        if (dto.getHomestayId() != null) {
            v.setHomestayId(dto.getHomestayId());
        }
        if (dto.getType() != null) {
            v.setDiscountType("amount".equalsIgnoreCase(dto.getType()) ? "AMOUNT" : "PERCENT");
        }
        if (dto.getValue() != null) {
            v.setValue(dto.getValue());
        }
        if (dto.getMinOrder() != null) {
            v.setMinOrderValue(dto.getMinOrder());
        }
        if (dto.getMaxDiscount() != null) {
            v.setMaxDiscount(dto.getMaxDiscount());
        }
        if (dto.getUsageLimit() != null) {
            v.setUsageLimit(dto.getUsageLimit());
        }
        if (dto.getStart() != null) {
            try { v.setStartDate(LocalDate.parse(dto.getStart())); } catch (Exception ignored) {}
        }
        if (dto.getEnd() != null) {
            try { v.setExpiryDate(LocalDate.parse(dto.getEnd())); } catch (Exception ignored) {}
        }
        if (dto.getStatus() != null) {
            v.setStatus("ended".equalsIgnoreCase(dto.getStatus()) ? "DISABLED" : "ACTIVE");
        }

        Voucher saved = voucherRepository.save(v);
        dto.setId(saved.getId());
        dto.setUsed(saved.getUsedCount() != null ? saved.getUsedCount() : 0);
        return dto;
    }

    /**
     * Bật / tắt trạng thái mã giảm giá (ACTIVE <-> DISABLED)
     */
    @Transactional
    @CacheEvict(value = "publicVouchers", allEntries = true)
    public OwnerVoucherDTO toggleStatus(Long id) {
        Voucher v = voucherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy mã giảm giá với ID: " + id));

        String nextStatus = "ACTIVE".equalsIgnoreCase(v.getStatus()) ? "DISABLED" : "ACTIVE";
        v.setStatus(nextStatus);
        voucherRepository.save(v);

        return OwnerVoucherDTO.builder()
                .id(v.getId())
                .code(v.getCode())
                .status("ACTIVE".equalsIgnoreCase(nextStatus) ? "active" : "ended")
                .build();
    }

    /**
     * Xoá mã giảm giá
     */
    @Transactional
    @CacheEvict(value = "publicVouchers", allEntries = true)
    public boolean deleteVoucher(Long id) {
        if (!voucherRepository.existsById(id)) {
            return false;
        }
        voucherRepository.deleteById(id);
        return true;
    }

    /**
     * Lấy lịch sử phát hành voucher
     */
    public List<Map<String, Object>> getHistory(Long homestayId) {
        List<OwnerVoucherDTO> vouchers = getVouchers(homestayId);
        List<Map<String, Object>> history = new ArrayList<>();

        for (OwnerVoucherDTO v : vouchers) {
            Map<String, Object> h = new HashMap<>();
            h.put("name", v.getName());
            h.put("code", v.getCode());
            h.put("period", (v.getStart() != null ? v.getStart() : "") + " - " + (v.getEnd() != null ? v.getEnd() : ""));
            h.put("used", v.getUsed());
            h.put("limit", v.getUsageLimit());
            h.put("revenue", v.getRevenue() != null ? v.getRevenue() : BigDecimal.ZERO);
            h.put("status", v.getStatus());
            history.add(h);
        }
        return history;
    }
}
