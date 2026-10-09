package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.hcmuaf.fit.springboot.model.Category;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.HomestayImage;
import vn.edu.hcmuaf.fit.springboot.repository.CategoryRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayImageRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.ReviewRepository;

import java.text.DecimalFormat;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/home")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class HomeController {

    private final CategoryRepository categoryRepository;
    private final HomestayRepository homestayRepository;
    private final HomestayImageRepository homestayImageRepository;
    private final ReviewRepository reviewRepository;

    private String formatPrice(java.math.BigDecimal price) {
        if (price == null) return "0đ";
        DecimalFormat formatter = new DecimalFormat("#,###");
        return formatter.format(price).replace(",", ".") + "đ";
    }

    @GetMapping
    @Cacheable("homePageData")
    public ResponseEntity<Map<String, Object>> getHomePageData() {
        Map<String, Object> response = new HashMap<>();

        // 1. Hero Slides
        List<Map<String, Object>> heroSlides = Arrays.asList(
                Map.of("id", 1, "img", "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80", "title", "Homestay giữa núi rừng bản địa chân thực"),
                Map.of("id", 2, "img", "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80", "title", "Homestay Sapa bồng bềnh mây ngàn"),
                Map.of("id", 3, "img", "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1600&q=80", "title", "Homestay Hội An cổ kính thơ mộng")
        );

        // 2. Experiences from DB
        List<Category> categoryList = categoryRepository.findAll();
        List<Map<String, Object>> experiences = categoryList.stream().map(cat -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", cat.getId());
            map.put("title", cat.getName());
            map.put("desc", cat.getDescription());
            map.put("tag", cat.getShortLabel() != null && !cat.getShortLabel().isEmpty() ? cat.getShortLabel() : cat.getName());
            
            String imgUrl = cat.getImageUrl();
            if (imgUrl == null || imgUrl.isEmpty()) {
                String name = cat.getName().toLowerCase();
                if (name.contains("nông trại")) imgUrl = "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80";
                else if (name.contains("sông nước")) imgUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80";
                else if (name.contains("nhà quê")) imgUrl = "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80";
                else if (name.contains("ẩm thực")) imgUrl = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80";
                else if (name.contains("làng nghề")) imgUrl = "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80";
                else if (name.contains("thiên nhiên")) imgUrl = "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80";
                else if (name.contains("đời sống")) imgUrl = "https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=600&q=80";
                else imgUrl = "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80"; // Miệt vườn default
            }
            map.put("img", imgUrl);
            return map;
        }).collect(Collectors.toList());

        // 3. Combos
        List<Map<String, Object>> combos = Arrays.asList(
                Map.of("id", 1, "title", "INTERCONTINENTAL ĐÀ NẴNG", "discount", "Combo tiết kiệm đến 34%", "days", "Combo 3N2Đ", "desc", "Bay khứ hồi · Phòng ban công toàn cảnh · Ăn sáng buffet cao cấp", "price", "14.799.000đ", "img", "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80"),
                Map.of("id", 2, "title", "TOPAS ECOLODGE SAPA", "discount", "Tiết kiệm 28%", "days", "Combo 3N2Đ Săn Mây", "desc", "Xe Limousine đón tiễn · Bungalow thung lũng Mường Hoa · Hồ bơi nước ấm", "price", "4.590.000đ", "img", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80"),
                Map.of("id", 3, "title", "ANA MANDARA VILLAS ĐÀ LẠT", "discount", "Ưu đãi mùa thu 30%", "days", "Combo 2N1Đ Sang Trọng", "desc", "Biệt thự cổ phong cách Pháp · Trà chiều hoàng gia · Ăn sáng tại phòng riêng", "price", "2.890.000đ", "img", "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80")
        );

        // 1. Bulk DB fetch to eliminate N+1 queries for lightning fast response time
        List<Homestay> allHomestays = homestayRepository.findAll();
        List<HomestayImage> allImages = homestayImageRepository.findAll();
        List<vn.edu.hcmuaf.fit.springboot.model.Review> allReviews = reviewRepository.findAll();

        Map<Long, String> imageMap = new HashMap<>();
        for (HomestayImage img : allImages) {
            if (img.getHomestayId() != null && (!imageMap.containsKey(img.getHomestayId()) || Boolean.TRUE.equals(img.getIsPrimary()))) {
                imageMap.put(img.getHomestayId(), img.getImageUrl());
            }
        }

        Map<Long, Integer> reviewCountMap = new HashMap<>();
        for (vn.edu.hcmuaf.fit.springboot.model.Review r : allReviews) {
            if (r.getHomestayId() != null) {
                reviewCountMap.put(r.getHomestayId(), reviewCountMap.getOrDefault(r.getHomestayId(), 0) + 1);
            }
        }

        // Sort by rating descending
        allHomestays.sort((h1, h2) -> {
            Double r1 = h1.getRating() != null ? h1.getRating() : 0.0;
            Double r2 = h2.getRating() != null ? h2.getRating() : 0.0;
            return r2.compareTo(r1);
        });

        // 4. Festivals (Dynamic from DB)
        List<Homestay> danangList = allHomestays.stream()
                .filter(h -> (h.getCity() != null && (h.getCity().toLowerCase().contains("đà nẵng") || h.getCity().toLowerCase().contains("da nang"))) ||
                             (h.getAddress() != null && (h.getAddress().toLowerCase().contains("đà nẵng") || h.getAddress().toLowerCase().contains("da nang"))))
                .collect(Collectors.toList());
        if (danangList.isEmpty()) {
            danangList = allHomestays.stream().limit(3).collect(Collectors.toList());
        }

        List<Map<String, Object>> diffHomestays = new ArrayList<>();
        for (int i = 0; i < danangList.size(); i++) {
            Homestay h = danangList.get(i);
            Map<String, Object> map = new HashMap<>();
            map.put("id", h.getId());
            map.put("name", h.getName());
            map.put("location", h.getAddress() != null ? h.getAddress() : (h.getCity() != null ? h.getCity() : "Đà Nẵng"));
            map.put("distance", "Cách điểm bắn pháo hoa ~" + ((i + 1) * 350) + "m");
            map.put("rating", h.getRating() != null ? String.valueOf(h.getRating()) : "4.95");
            map.put("reviews", String.valueOf(reviewCountMap.getOrDefault(h.getId(), 15)));
            map.put("price", formatPrice(h.getBasePrice()));
            map.put("tag", i % 2 == 0 ? "Gần khán đài pháo hoa" : "Đi bộ ra lễ hội");
            map.put("img", imageMap.getOrDefault(h.getId(), "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"));
            diffHomestays.add(map);
        }

        List<Homestay> dalatList = allHomestays.stream()
                .filter(h -> (h.getCity() != null && (h.getCity().toLowerCase().contains("đà lạt") || h.getCity().toLowerCase().contains("da lat"))) ||
                             (h.getAddress() != null && (h.getAddress().toLowerCase().contains("đà lạt") || h.getAddress().toLowerCase().contains("da lat"))))
                .collect(Collectors.toList());
        if (dalatList.isEmpty()) {
            dalatList = allHomestays.stream().limit(3).collect(Collectors.toList());
        }

        List<Map<String, Object>> dalatHomestays = new ArrayList<>();
        for (int i = 0; i < dalatList.size(); i++) {
            Homestay h = dalatList.get(i);
            Map<String, Object> map = new HashMap<>();
            map.put("id", h.getId());
            map.put("name", h.getName());
            map.put("location", h.getAddress() != null ? h.getAddress() : (h.getCity() != null ? h.getCity() : "Đà Lạt"));
            map.put("distance", "Cách Quảng trường ~" + ((i + 1) * 400) + "m");
            map.put("rating", h.getRating() != null ? String.valueOf(h.getRating()) : "4.96");
            map.put("reviews", String.valueOf(reviewCountMap.getOrDefault(h.getId(), 20)));
            map.put("price", formatPrice(h.getBasePrice()));
            map.put("tag", i % 2 == 0 ? "Đi bộ ra Festival" : "Săn mây thung lũng");
            map.put("img", imageMap.getOrDefault(h.getId(), "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"));
            dalatHomestays.add(map);
        }

        Map<String, Object> festivals = new HashMap<>();
        festivals.put("diff", Map.of(
                "badge", "Sắp diễn ra vào tháng 6",
                "name", "Lễ Hội Pháo Hoa Quốc Tế Đà Nẵng (DIFF)",
                "location", "Sân khấu bờ sông Hàn, TP. Đà Nẵng",
                "date", "08/06 - 13/07/2026",
                "homestays", diffHomestays
        ));
        festivals.put("dalat", Map.of(
                "badge", "Khai mạc cuối năm",
                "name", "Festival Hoa Đà Lạt Sắc Màu Xứ Ngàn Hoa",
                "location", "Quảng trường Lâm Viên & Hồ Xuân Hương, Đà Lạt",
                "date", "18/12 - 31/12/2026",
                "homestays", dalatHomestays
        ));

        // Map Homestay to Map<String, Object> for UI
        List<Map<String, Object>> mappedHomestays = allHomestays.stream().map(h -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", h.getId());
            map.put("name", h.getName());
            
            // Generate a simple city slug if city is available
            String citySlug = "other";
            if (h.getCity() != null) {
                String c = h.getCity().toLowerCase();
                if (c.contains("đà lạt")) citySlug = "dalat";
                else if (c.contains("đà nẵng")) citySlug = "danang";
                else if (c.contains("hội an")) citySlug = "hoian";
                else if (c.contains("sapa") || c.contains("sa pa")) citySlug = "sapa";
                else citySlug = c.replaceAll("\\s+", "-");
            }
            map.put("city", citySlug);
            map.put("location", h.getCity() != null ? h.getCity() : (h.getAddress() != null ? h.getAddress() : "Việt Nam"));
            map.put("rating", h.getRating() != null ? h.getRating() : 4.5);
            map.put("reviews", reviewCountMap.getOrDefault(h.getId(), 10));
            map.put("specs", (h.getNumRooms() != null ? h.getNumRooms() : 1) + " phòng ngủ · " + (h.getMaxGuests() != null ? h.getMaxGuests() : 2) + " khách");
            map.put("amenities", h.getAmenities() != null ? h.getAmenities() : "Đầy đủ tiện nghi");
            map.put("price", formatPrice(h.getBasePrice()));
            map.put("img", imageMap.getOrDefault(h.getId(), "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"));
            return map;
        }).collect(Collectors.toList());

        // 5. Hot Homestays (Top 4)
        List<Map<String, Object>> hotHomestays = mappedHomestays.stream().limit(4).map(m -> {
            Map<String, Object> updated = new HashMap<>(m);
            updated.put("tag", "Top Bán Chạy");
            return updated;
        }).collect(Collectors.toList());

        // 6. Favorite Homestays (Next 4 or Random 4)
        List<Map<String, Object>> favoritesHomestays = mappedHomestays.stream().skip(Math.max(0, mappedHomestays.size() - 4)).map(m -> {
            Map<String, Object> updated = new HashMap<>(m);
            updated.put("tag", "Du khách yêu thích");
            return updated;
        }).collect(Collectors.toList());

        response.put("heroSlides", heroSlides);
        response.put("experiences", experiences);
        response.put("combos", combos);
        response.put("festivals", festivals);
        response.put("hotHomestays", hotHomestays);
        response.put("favoritesHomestays", favoritesHomestays);

        return ResponseEntity.ok(response);
    }
}
