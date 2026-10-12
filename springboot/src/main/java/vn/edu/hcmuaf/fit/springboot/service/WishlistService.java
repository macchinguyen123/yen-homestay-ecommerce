package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.dto.WishlistDTO;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.HomestayImage;
import vn.edu.hcmuaf.fit.springboot.model.Review;
import vn.edu.hcmuaf.fit.springboot.model.Wishlist;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayImageRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.ReviewRepository;
import vn.edu.hcmuaf.fit.springboot.repository.WishlistRepository;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final HomestayRepository homestayRepository;
    private final HomestayImageRepository homestayImageRepository;
    private final ReviewRepository reviewRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @jakarta.annotation.PostConstruct
    public void initWishlistTableSequence() {
        try {
            jdbcTemplate.execute("CREATE SEQUENCE IF NOT EXISTS wishlists_wishlist_id_seq");
            Long maxId = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(wishlist_id), 0) FROM wishlists", Long.class);
            if (maxId == null) maxId = 0L;
            jdbcTemplate.execute("SELECT setval('wishlists_wishlist_id_seq', " + Math.max(maxId, 1L) + ")");
            jdbcTemplate.execute("ALTER TABLE wishlists ALTER COLUMN wishlist_id SET DEFAULT nextval('wishlists_wishlist_id_seq')");
        } catch (Exception e) {
            log.warn("Lỗi cấu hình sequence cho bảng wishlists: {}", e.getMessage());
        }
    }

    private static final String DEFAULT_IMG = "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80";

    public static String toRegionSlug(String city) {
        if (city == null || city.trim().isEmpty()) return "all";
        String lower = city.toLowerCase().trim();
        if (lower.contains("đà lạt") || lower.contains("da lat")) return "dalat";
        if (lower.contains("sa pa") || lower.contains("sapa")) return "sapa";
        if (lower.contains("pù luông") || lower.contains("pu luong")) return "puluong";
        if (lower.contains("mai châu") || lower.contains("mai chau")) return "maichau";
        if (lower.contains("hội an") || lower.contains("hoi an")) return "hoian";
        if (lower.contains("ninh bình") || lower.contains("ninh binh")) return "ninhbinh";
        if (lower.contains("hà giang") || lower.contains("ha giang")) return "hagiang";
        if (lower.contains("mộc châu") || lower.contains("moc chau")) return "mocchau";
        if (lower.contains("đà nẵng") || lower.contains("da nang")) return "danang";
        if (lower.contains("huế") || lower.contains("hue")) return "hue";

        String nfd = Normalizer.normalize(lower, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String noAccents = pattern.matcher(nfd).replaceAll("").replace("đ", "d");
        return noAccents.replaceAll("[^a-z0-9]", "");
    }

    private String formatPrice(BigDecimal price) {
        if (price == null) return "0đ";
        DecimalFormat formatter = new DecimalFormat("#,###");
        return formatter.format(price).replace(",", ".") + "đ";
    }

    /**
     * Lấy danh sách yêu thích của người dùng từ CSDL theo touristId
     */
    public List<WishlistDTO> getWishlistByUserId(Long userId) {
        if (userId == null) {
            return Collections.emptyList();
        }

        List<Wishlist> wishlists = wishlistRepository.findByTouristIdOrderByCreatedAtDesc(userId);
        if (wishlists.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> homestayIds = wishlists.stream().map(Wishlist::getHomestayId).collect(Collectors.toList());
        List<Homestay> homestays = homestayRepository.findAllById(homestayIds);
        Map<Long, Homestay> homestayMap = homestays.stream().collect(Collectors.toMap(Homestay::getId, h -> h, (h1, h2) -> h1));

        Map<Long, String> imageMap = fetchPrimaryImages(homestayIds);
        Map<Long, Integer> reviewCountMap = fetchReviewCounts(homestayIds);

        List<WishlistDTO> result = new ArrayList<>();
        for (Wishlist w : wishlists) {
            Homestay h = homestayMap.get(w.getHomestayId());
            if (h != null) {
                result.add(buildDTO(h, w.getId(), w.getTouristId(), w.getCreatedAt(), imageMap, reviewCountMap));
            }
        }
        return result;
    }

    /**
     * Lấy danh sách homestay gợi ý/nổi bật từ DB để làm dữ liệu mẫu động khi chưa đăng nhập hoặc wishlist rỗng
     */
    @Cacheable("publicWishlist")
    public List<WishlistDTO> getPublicWishlist() {
        PageRequest pageRequest = PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "rating"));
        List<Homestay> topHomestays = homestayRepository.findAll(pageRequest).getContent();

        List<Long> homestayIds = topHomestays.stream().map(Homestay::getId).collect(Collectors.toList());
        Map<Long, String> imageMap = fetchPrimaryImages(homestayIds);
        Map<Long, Integer> reviewCountMap = fetchReviewCounts(homestayIds);

        List<WishlistDTO> result = new ArrayList<>();
        int i = 0;
        for (Homestay h : topHomestays) {
            LocalDateTime fakeCreated = LocalDateTime.now().minusDays(i++);
            result.add(buildDTO(h, null, null, fakeCreated, imageMap, reviewCountMap));
        }
        return result;
    }

    /**
     * Thêm homestay vào wishlist
     */
    @Transactional
    @CacheEvict(value = "publicWishlist", allEntries = true)
    public WishlistDTO addToWishlist(Long userId, Long homestayId) {
        if (userId == null || homestayId == null) {
            throw new IllegalArgumentException("User ID và Homestay ID không được để trống");
        }

        Optional<Wishlist> existing = wishlistRepository.findByTouristIdAndHomestayId(userId, homestayId);
        Wishlist wishlist;
        if (existing.isPresent()) {
            wishlist = existing.get();
        } else {
            wishlist = Wishlist.builder()
                    .touristId(userId)
                    .homestayId(homestayId)
                    .createdAt(LocalDateTime.now())
                    .build();
            wishlist = wishlistRepository.save(wishlist);
            log.info("Đã thêm Homestay ID {} vào yêu thích của User ID {}", homestayId, userId);
        }

        Homestay h = homestayRepository.findById(homestayId).orElse(null);
        if (h == null) {
            return WishlistDTO.builder()
                    .id(homestayId)
                    .homestayId(homestayId)
                    .touristId(userId)
                    .createdAt(wishlist.getCreatedAt())
                    .build();
        }

        Map<Long, String> imageMap = fetchPrimaryImages(Collections.singletonList(homestayId));
        Map<Long, Integer> reviewCountMap = fetchReviewCounts(Collections.singletonList(homestayId));
        return buildDTO(h, wishlist.getId(), userId, wishlist.getCreatedAt(), imageMap, reviewCountMap);
    }

    /**
     * Xóa 1 homestay khỏi wishlist của user
     */
    @Transactional
    @CacheEvict(value = "publicWishlist", allEntries = true)
    public void removeFromWishlist(Long userId, Long homestayId) {
        if (userId == null || homestayId == null) {
            throw new IllegalArgumentException("User ID và Homestay ID không được để trống");
        }
        wishlistRepository.deleteByTouristIdAndHomestayId(userId, homestayId);
        log.info("Đã xóa Homestay ID {} khỏi danh sách yêu thích của User ID {}", homestayId, userId);
    }

    /**
     * Xóa toàn bộ homestay trong wishlist của user
     */
    @Transactional
    @CacheEvict(value = "publicWishlist", allEntries = true)
    public void clearWishlist(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("User ID không được để trống");
        }
        wishlistRepository.deleteByTouristId(userId);
        log.info("Đã xóa sạch wishlist của User ID {}", userId);
    }

    private Map<Long, String> fetchPrimaryImages(List<Long> homestayIds) {
        if (homestayIds.isEmpty()) return Collections.emptyMap();
        List<HomestayImage> images = homestayImageRepository.findByHomestayIdIn(homestayIds);
        Map<Long, String> imageMap = new HashMap<>();
        for (HomestayImage img : images) {
            if (img.getHomestayId() != null && (!imageMap.containsKey(img.getHomestayId()) || Boolean.TRUE.equals(img.getIsPrimary()))) {
                imageMap.put(img.getHomestayId(), img.getImageUrl());
            }
        }
        return imageMap;
    }

    private Map<Long, Integer> fetchReviewCounts(List<Long> homestayIds) {
        if (homestayIds.isEmpty()) return Collections.emptyMap();
        List<Review> reviews = reviewRepository.findByHomestayIdIn(homestayIds);
        Map<Long, Integer> countMap = new HashMap<>();
        for (Review r : reviews) {
            if (r.getHomestayId() != null) {
                countMap.put(r.getHomestayId(), countMap.getOrDefault(r.getHomestayId(), 0) + 1);
            }
        }
        return countMap;
    }

    private WishlistDTO buildDTO(Homestay h, Long wishlistId, Long touristId, LocalDateTime createdAt,
                                 Map<Long, String> imageMap, Map<Long, Integer> reviewCountMap) {
        String city = h.getCity() != null ? h.getCity() : "Việt Nam";
        String region = toRegionSlug(city);
        String name = h.getName() != null ? h.getName() : "Homestay #" + h.getId();
        Double rating = h.getRating() != null ? h.getRating() : 4.9;
        int reviewCount = reviewCountMap.getOrDefault(h.getId(), 24);
        int numRooms = h.getNumRooms() != null ? h.getNumRooms() : 2;
        int maxGuests = h.getMaxGuests() != null ? h.getMaxGuests() : 4;
        String specs = numRooms + " phòng ngủ • " + maxGuests + " khách";

        String amenities = (h.getAmenities() != null && !h.getAmenities().trim().isEmpty())
                ? h.getAmenities()
                : "Bể bơi nước ấm · Lò sưởi củi · Sân BBQ";

        String img = imageMap.getOrDefault(h.getId(), DEFAULT_IMG);
        if (img == null || img.trim().isEmpty()) {
            img = DEFAULT_IMG;
        }

        long epoch = createdAt != null ? createdAt.toEpochSecond(ZoneOffset.UTC) : System.currentTimeMillis() / 1000;

        String tag = "Yêu thích";
        if (rating >= 4.95) {
            tag = "Top 1 Bán Chạy";
        } else if (rating >= 4.9) {
            tag = "Nổi bật 2026";
        } else if (h.getBasePrice() != null && h.getBasePrice().compareTo(BigDecimal.valueOf(800000)) <= 0) {
            tag = "Giá tốt nhất";
        } else {
            tag = "Sinh thái xanh";
        }

        return WishlistDTO.builder()
                .id(h.getId())
                .homestayId(h.getId())
                .touristId(touristId)
                .name(name)
                .title(name)
                .city(city)
                .region(region)
                .location(city)
                .address(h.getAddress() != null ? h.getAddress() : city)
                .rating(rating)
                .reviews(reviewCount)
                .specs(specs)
                .amenities(amenities)
                .features(amenities)
                .price(formatPrice(h.getBasePrice()))
                .rawPrice(h.getBasePrice() != null ? h.getBasePrice() : BigDecimal.ZERO)
                .img(img)
                .image(img)
                .tag(tag)
                .badge(tag)
                .date(epoch)
                .createdAt(createdAt)
                .build();
    }
}
