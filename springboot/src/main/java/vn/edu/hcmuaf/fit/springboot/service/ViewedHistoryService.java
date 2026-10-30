package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.dto.ViewedHistoryDTO;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.ViewedHistory;
import vn.edu.hcmuaf.fit.springboot.model.HomestayImage;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayImageRepository;
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
    private final HomestayImageRepository homestayImageRepository;
    private final WishlistRepository wishlistRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbc;

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

        try {
            jdbc.update(
                "INSERT INTO viewed_histories (user_id, homestay_id, viewed_at) VALUES (?, ?, timezone('Asia/Ho_Chi_Minh', CURRENT_TIMESTAMP)) " +
                "ON CONFLICT (user_id, homestay_id) DO UPDATE SET viewed_at = timezone('Asia/Ho_Chi_Minh', CURRENT_TIMESTAMP)",
                userId, homestayId);
            Optional<ViewedHistory> updated = viewedHistoryRepository.findByUserIdAndHomestayId(userId, homestayId);
            if (updated.isPresent()) {
                return mapToDTO(updated.get(), userId, vietnamNow());
            }
        } catch (Exception e) {
            log.warn("Lỗi khi ghi nhận lịch sử xem (upsert): {}", e.getMessage());
        }

        ViewedHistory fallback = ViewedHistory.builder()
                .userId(userId)
                .homestayId(homestayId)
                .viewedAt(vietnamNow())
                .build();
        return mapToDTO(fallback, userId, vietnamNow());
    }

    /**
     * Lấy danh sách lịch sử đã xem của chính user, sắp xếp thời gian mới nhất lên đầu.
     */
    public List<ViewedHistoryDTO> getViewedHistory(Long userId) {
        if (userId == null) {
            return Collections.emptyList();
        }

        List<ViewedHistory> list = viewedHistoryRepository.findByUserIdOrderByViewedAtDesc(userId);
        if (list.isEmpty()) return Collections.emptyList();
        LocalDateTime now = vietnamNow();
        List<Long> homestayIds = list.stream().map(ViewedHistory::getHomestayId).filter(Objects::nonNull).distinct().toList();
        Map<Long, Homestay> homestayMap = homestayRepository.findAllById(homestayIds).stream()
                .collect(Collectors.toMap(Homestay::getId, h -> h, (a, b) -> a));
        Map<Long, String> imageMap = new HashMap<>();
        for (HomestayImage image : homestayImageRepository.findByHomestayIdIn(homestayIds)) {
            if (image.getHomestayId() != null && image.getImageUrl() != null && !image.getImageUrl().isBlank()
                    && (!imageMap.containsKey(image.getHomestayId()) || Boolean.TRUE.equals(image.getIsPrimary()))) {
                imageMap.put(image.getHomestayId(), image.getImageUrl());
            }
        }
        Set<Long> likedIds = wishlistRepository.findByTouristIdAndHomestayIdIn(userId, homestayIds).stream()
                .map(v -> v.getHomestayId()).collect(Collectors.toSet());
        return list.stream()
                .map(item -> mapToDTO(item, userId, now, homestayMap, imageMap, likedIds))
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

    private LocalDateTime vietnamNow() {
        try {
            return jdbc.queryForObject("SELECT timezone('Asia/Ho_Chi_Minh', CURRENT_TIMESTAMP)", LocalDateTime.class);
        } catch (Exception ignored) {
            return LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        }
    }

    private ViewedHistoryDTO mapToDTO(ViewedHistory entity, Long userId, LocalDateTime now) {
        return mapToDTO(entity, userId, now, null, null, null);
    }

    private ViewedHistoryDTO mapToDTO(ViewedHistory entity, Long userId, LocalDateTime now,
                                      Map<Long, Homestay> homestayMap, Map<Long, String> imageMap,
                                      Set<Long> likedIds) {
        Long hId = entity.getHomestayId();

        Homestay h = homestayMap != null ? homestayMap.get(hId) : entity.getHomestay();
        if (homestayMap == null && h == null) h = homestayRepository.findById(hId).orElse(null);

        String name = (h != null && h.getName() != null) ? h.getName() : "Homestay #" + hId;
        String location = (h != null && h.getCity() != null) ? h.getCity() : ((h != null && h.getAddress() != null) ? h.getAddress() : "Chưa cập nhật địa điểm");
        String rating = (h != null && h.getRating() != null) ? String.format(Locale.US, "%.1f", h.getRating()) : "—";
        String reviews = "";

        String numRoomsStr = (h != null && h.getNumRooms() != null) ? h.getNumRooms() + " phòng ngủ" : "Chưa cập nhật số phòng";
        String maxGuestsStr = (h != null && h.getMaxGuests() != null) ? h.getMaxGuests() + " khách" : "Chưa cập nhật sức chứa";
        String specs = numRoomsStr + " • " + maxGuestsStr;

        String amenities = (h != null && h.getAmenities() != null && !h.getAmenities().isEmpty())
                ? h.getAmenities()
                : "";

        DecimalFormat df = new DecimalFormat("#,###");
        String price = (h != null && h.getBasePrice() != null)
                ? df.format(h.getBasePrice()) + "đ"
                : "Liên hệ để biết giá";

        // Query real image from homestay_images table
        String img = imageMap == null ? null : imageMap.get(hId);
        if (imageMap == null) {
            try {
                List<HomestayImage> imgs = homestayImageRepository.findByHomestayId(hId);
                if (imgs != null && !imgs.isEmpty()) {
                    for (HomestayImage hi : imgs) {
                        if (hi.getImageUrl() != null && !hi.getImageUrl().isBlank()) {
                            img = hi.getImageUrl();
                            break;
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Lỗi khi tải ảnh cho homestay {}: {}", hId, e.getMessage());
            }
        }

        // Wishlist status check
        boolean isFav = likedIds != null && likedIds.contains(hId);
        if (likedIds == null && userId != null) {
            try {
                isFav = wishlistRepository.existsByTouristIdAndHomestayId(userId, hId);
            } catch (Exception ignored) {}
        }

        return ViewedHistoryDTO.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .homestayId(hId)
                .name(name)
                .location(location)
                .timeAgo(formatTimeAgo(entity.getViewedAt(), now))
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

    private String formatTimeAgo(LocalDateTime dateTime, LocalDateTime now) {
        if (dateTime == null) return "Vừa xem";
        Duration duration = Duration.between(dateTime, now);
        // Dữ liệu cũ được lưu theo UTC wall time, trong khi lịch sử mới dùng giờ Việt Nam.
        if (duration.toHours() >= 6 && duration.toHours() <= 8) {
            duration = Duration.between(dateTime.plusHours(7), now);
        }
        if (duration.isNegative()) return "Vừa xem";
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
