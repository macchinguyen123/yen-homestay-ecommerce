package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.dto.ViewedHistoryDTO;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.ViewedHistory;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.ViewedHistoryRepository;
import vn.edu.hcmuaf.fit.springboot.repository.WishlistRepository;

import java.text.DecimalFormat;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ViewedHistoryService {

    private final ViewedHistoryRepository viewedHistoryRepository;
    private final HomestayRepository homestayRepository;
    private final WishlistRepository wishlistRepository;

    // Preset metadata lookup for rich details
    private static final Map<Long, ViewedHistoryDTO> PRESET_HOMESTAYS = new HashMap<>();

    static {
        PRESET_HOMESTAYS.put(1L, ViewedHistoryDTO.builder()
                .homestayId(1L)
                .name("Han River Glass House")
                .location("Đà Nẵng")
                .rating("4.95")
                .reviews("184")
                .specs("2 phòng ngủ • 4 khách")
                .amenities("Bờ sông Hàn · Căn hộ kính panorama · Đặt gần đây")
                .price("1.150.000đ")
                .img("https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80")
                .build());

        PRESET_HOMESTAYS.put(2L, ViewedHistoryDTO.builder()
                .homestayId(2L)
                .name("The Memory Valley Villa")
                .location("Đà Lạt")
                .rating("4.96")
                .reviews("340")
                .specs("3 phòng ngủ • 8 khách")
                .amenities("Săn mây Đà Lạt · Bể bơi nước ấm · BBQ sân vườn")
                .price("1.450.000đ")
                .img("https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80")
                .build());

        PRESET_HOMESTAYS.put(3L, ViewedHistoryDTO.builder()
                .homestayId(3L)
                .name("Topas Ecolodge Sapa")
                .location("Sapa")
                .rating("4.98")
                .reviews("310")
                .specs("Bungalow • 2 khách")
                .amenities("Bể bơi vô cực nước ấm · Mường Hoa · Đưa đón Limousine")
                .price("4.590.000đ")
                .img("https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80")
                .build());

        PRESET_HOMESTAYS.put(4L, ViewedHistoryDTO.builder()
                .homestayId(4L)
                .name("Tràng An Valley Retreat")
                .location("Ninh Bình")
                .rating("4.96")
                .reviews("175")
                .specs("Bungalow núi • 2 khách")
                .amenities("View núi đá vôi · Khinh khí cầu · Xe đạp dạo đầm sen")
                .price("1.050.000đ")
                .img("https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80")
                .build());

        PRESET_HOMESTAYS.put(5L, ViewedHistoryDTO.builder()
                .homestayId(5L)
                .name("Nhà Rường Cổ Cố Đô")
                .location("Huế")
                .rating("4.94")
                .reviews("167")
                .specs("Nhà Rường • 4 khách")
                .amenities("Cách Đại Nội 350m · Thưởng trà sen · Thử áo dài miễn phí")
                .price("890.000đ")
                .img("https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80")
                .build());

        PRESET_HOMESTAYS.put(6L, ViewedHistoryDTO.builder()
                .homestayId(6L)
                .name("Sơn Trà Sunset Villa")
                .location("Đà Nẵng")
                .rating("4.94")
                .reviews("215")
                .specs("Villa 4 phòng • 10 khách")
                .amenities("Bể bơi vô cực view biển · Nướng BBQ sân vườn · VIP")
                .price("2.750.000đ")
                .img("https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80")
                .build());
    }

    /**
     * Ghi nhận lịch sử xem sản phẩm của user.
     * Nếu user xem lại sản phẩm đã có -> cập nhật thời gian xem (viewed_at), không tạo trùng.
     */
    @Transactional
    public ViewedHistoryDTO recordView(Long userId, Long homestayId) {
        if (userId == null || homestayId == null) {
            throw new IllegalArgumentException("User ID và Homestay ID không được để trống");
        }

        Optional<ViewedHistory> existing = viewedHistoryRepository.findByUserIdAndHomestayId(userId, homestayId);
        ViewedHistory history;

        if (existing.isPresent()) {
            history = existing.get();
            history.setViewedAt(LocalDateTime.now());
            log.info("Cập nhật thời gian xem sản phẩm cho User ID: {}, Homestay ID: {}", userId, homestayId);
        } else {
            history = ViewedHistory.builder()
                    .userId(userId)
                    .homestayId(homestayId)
                    .viewedAt(LocalDateTime.now())
                    .build();
            log.info("Tạo mới lịch sử xem sản phẩm cho User ID: {}, Homestay ID: {}", userId, homestayId);
        }

        ViewedHistory saved = viewedHistoryRepository.save(history);
        return mapToDTO(saved, userId);
    }

    /**
     * Lấy danh sách lịch sử đã xem của chính user, sắp xếp thời gian mới nhất lên đầu.
     */
    public List<ViewedHistoryDTO> getViewedHistory(Long userId) {
        if (userId == null) {
            return Collections.emptyList();
        }

        List<ViewedHistory> list = viewedHistoryRepository.findByUserIdOrderByViewedAtDesc(userId);
        return list.stream()
                .map(item -> mapToDTO(item, userId))
                .collect(Collectors.toList());
    }

    /**
     * Xóa 1 sản phẩm khỏi lịch sử xem.
     */
    @Transactional
    public void deleteViewedItem(Long userId, Long homestayId) {
        viewedHistoryRepository.deleteByUserIdAndHomestayId(userId, homestayId);
        log.info("Đã xóa sản phẩm Homestay ID {} khỏi lịch sử của User ID {}", homestayId, userId);
    }

    /**
     * Xóa toàn bộ lịch sử xem của user.
     */
    @Transactional
    public void clearViewedHistory(Long userId) {
        viewedHistoryRepository.deleteByUserId(userId);
        log.info("Đã xóa toàn bộ lịch sử xem của User ID {}", userId);
    }

    private ViewedHistoryDTO mapToDTO(ViewedHistory entity, Long userId) {
        Long hId = entity.getHomestayId();
        ViewedHistoryDTO preset = PRESET_HOMESTAYS.get(hId);

        String name = preset != null ? preset.getName() : "Homestay #" + hId;
        String location = preset != null ? preset.getLocation() : "Việt Nam";
        String rating = preset != null ? preset.getRating() : "4.95";
        String reviews = preset != null ? preset.getReviews() : "120";
        String specs = preset != null ? preset.getSpecs() : "2 phòng ngủ • 4 khách";
        String amenities = preset != null ? preset.getAmenities() : "Đầy đủ tiện nghi · WiFi miễn phí";
        String price = preset != null ? preset.getPrice() : "1.200.000đ";
        String img = preset != null ? preset.getImg() : "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80";

        // Try override from Homestay database table if present
        if (entity.getHomestay() != null) {
            Homestay h = entity.getHomestay();
            if (h.getName() != null) name = h.getName();
            if (h.getCity() != null) location = h.getCity();
            if (h.getRating() != null) rating = String.format(Locale.US, "%.2f", h.getRating());
            if (h.getBasePrice() != null) {
                DecimalFormat df = new DecimalFormat("#,###");
                price = df.format(h.getBasePrice()) + "đ";
            }
            if (h.getAmenities() != null && !h.getAmenities().isEmpty()) {
                amenities = h.getAmenities();
            }
        } else {
            Optional<Homestay> homestayOpt = homestayRepository.findById(hId);
            if (homestayOpt.isPresent()) {
                Homestay h = homestayOpt.get();
                if (h.getName() != null) name = h.getName();
                if (h.getCity() != null) location = h.getCity();
                if (h.getRating() != null) rating = String.format(Locale.US, "%.2f", h.getRating());
                if (h.getBasePrice() != null) {
                    DecimalFormat df = new DecimalFormat("#,###");
                    price = df.format(h.getBasePrice()) + "đ";
                }
            }
        }

        // Wishlist status check
        boolean isFav = false;
        if (userId != null) {
            isFav = wishlistRepository.existsByTouristIdAndHomestayId(userId, hId);
        }

        return ViewedHistoryDTO.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .homestayId(hId)
                .name(name)
                .location(location)
                .timeAgo(formatTimeAgo(entity.getViewedAt()))
                .rating(rating)
                .reviews(reviews)
                .specs(specs)
                .amenities(amenities)
                .price(price)
                .img(img)
                .isFav(isFav)
                .viewedAt(entity.getViewedAt())
                .build();
    }

    public static String formatTimeAgo(LocalDateTime dateTime) {
        if (dateTime == null) return "Vừa xem";
        LocalDateTime now = LocalDateTime.now();
        Duration duration = Duration.between(dateTime, now);
        long seconds = duration.getSeconds();

        if (seconds < 60) {
            return "Vừa xong";
        }
        long minutes = seconds / 60;
        if (minutes < 60) {
            return "Vừa xem " + minutes + " phút trước";
        }
        long hours = minutes / 60;
        if (hours < 24) {
            return "Vừa xem " + hours + " giờ trước";
        }
        long days = hours / 24;
        if (days == 1) {
            return "Xem hôm qua";
        }
        if (days < 30) {
            return "Xem " + days + " ngày trước";
        }
        return "Xem ngày " + dateTime.getDayOfMonth() + "/" + dateTime.getMonthValue();
    }
}
