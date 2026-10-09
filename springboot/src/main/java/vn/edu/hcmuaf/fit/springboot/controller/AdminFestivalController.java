package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.FestivalRequest;
import vn.edu.hcmuaf.fit.springboot.model.Festival;
import vn.edu.hcmuaf.fit.springboot.model.FestivalHomestay;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.HomestayImage;
import vn.edu.hcmuaf.fit.springboot.repository.FestivalRepository;
import vn.edu.hcmuaf.fit.springboot.repository.FestivalHomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayImageRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class AdminFestivalController {
    private final FestivalRepository festivalRepository;
    private final FestivalHomestayRepository festivalHomestayRepository;
    private final JdbcTemplate jdbcTemplate;
    private final HomestayRepository homestayRepository;
    private final HomestayImageRepository homestayImageRepository;

    @GetMapping("/admin/local-content/festivals")
    public List<Map<String, Object>> getFestivals() {
        return festivalRepository.findAll().stream().map(f -> toResponse(f, true)).toList();
    }

    @GetMapping("/admin/local-content/homestays")
    public List<Map<String, Object>> getHomestays(@RequestParam(required = false) String city) {
        List<Homestay> homestays = city == null || city.isBlank()
                ? homestayRepository.findAll()
                : homestayRepository.findByCityIgnoreCase(city.trim());
        Map<Long, String> images = primaryImages(homestays);
        return homestays.stream().map(h -> homestayResponse(h, images.get(h.getId()), null)).toList();
    }

    @PostMapping("/admin/local-content/festivals")
    @Transactional
    public ResponseEntity<?> create(@RequestBody FestivalRequest request) {
        String validation = validate(request);
        if (validation != null) return ResponseEntity.badRequest().body(Map.of("message", validation));
        Festival festival = new Festival();
        festival.setId(nextFestivalId());
        festivalRepository.save(toFestival(festival, request));
        saveRecommendations(festival, request);
        return ResponseEntity.ok(toResponse(festival, true));
    }

    @PutMapping("/admin/local-content/festivals/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody FestivalRequest request) {
        String validation = validate(request);
        if (validation != null) return ResponseEntity.badRequest().body(Map.of("message", validation));
        Optional<Festival> found = festivalRepository.findById(id);
        if (found.isEmpty()) return ResponseEntity.notFound().build();
        Festival festival = festivalRepository.save(toFestival(found.get(), request));
        festivalHomestayRepository.deleteAllForFestival(id);
        saveRecommendations(festival, request);
        return ResponseEntity.ok(toResponse(festival, true));
    }

    @DeleteMapping("/admin/local-content/festivals/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!festivalRepository.existsById(id)) return ResponseEntity.notFound().build();
        festivalHomestayRepository.deleteAllForFestival(id);
        festivalRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/public/festivals")
    public List<Map<String, Object>> getPublicFestivals() {
        return festivalRepository.findAll().stream()
                .filter(f -> !"ended".equals(status(f)))
                .map(f -> toResponse(f, true, true)).toList();
    }

    private String validate(FestivalRequest request) {
        if (request.getName() == null || request.getName().isBlank()) return "Tên lễ hội là bắt buộc.";
        if (request.getCity() == null || request.getCity().isBlank()) return "Tỉnh/thành phố là bắt buộc.";
        if (request.getName().length() > 255 || request.getCity().length() > 255 ||
                (request.getLocation() != null && request.getLocation().length() > 255) ||
                (request.getImageUrl() != null && request.getImageUrl().length() > 255) ||
                (request.getDescription() != null && request.getDescription().length() > 512) ||
                (request.getBadgeInfo() != null && request.getBadgeInfo().length() > 255)) {
            return "Một trường thông tin vượt quá độ dài cho phép trong bảng festivals.";
        }
        LocalDate start = parseDate(request.getStartDate()), end = parseDate(request.getEndDate());
        if (!blank(request.getStartDate()) && start == null) return "Ngày bắt đầu không hợp lệ.";
        if (!blank(request.getEndDate()) && end == null) return "Ngày kết thúc không hợp lệ.";
        if (start != null && end != null && end.isBefore(start)) return "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.";
        return null;
    }

    private Festival toFestival(Festival festival, FestivalRequest request) {
        festival.setName(request.getName().trim());
        festival.setCity(request.getCity().trim());
        festival.setLocation(trimToNull(request.getLocation()));
        festival.setImageUrl(trimToNull(request.getImageUrl()));
        festival.setDescription(trimToNull(request.getDescription()));
        festival.setStartDate(trimToNull(request.getStartDate()));
        festival.setEndDate(trimToNull(request.getEndDate()));
        festival.setBadgeInfo(trimToNull(request.getBadgeInfo()));
        return festival;
    }

    private Long nextFestivalId() {
        Long next = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(festival_id), 0) + 1 FROM festivals", Long.class);
        return next == null ? 1L : next;
    }

    private Map<String, Object> toResponse(Festival festival, boolean withHomes) {
        return toResponse(festival, withHomes, false);
    }

    private Map<String, Object> toResponse(Festival festival, boolean withHomes, boolean publicOnly) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", festival.getId()); result.put("name", festival.getName()); result.put("city", festival.getCity());
        result.put("location", festival.getLocation()); result.put("imageUrl", festival.getImageUrl());
        result.put("description", festival.getDescription()); result.put("startDate", festival.getStartDate());
        result.put("endDate", festival.getEndDate()); result.put("badgeInfo", festival.getBadgeInfo());
        String status = status(festival);
        result.put("status", status);
        result.put("nearbyHomestays", 0);
        if (withHomes) {
            List<FestivalHomestay> links = festivalHomestayRepository.findByFestivalIdOrderByDisplayOrderAscIdAsc(festival.getId());
            List<Homestay> homes = homestayRepository.findAllById(links.stream().map(FestivalHomestay::getHomestayId).toList());
            Map<Long, String> images = primaryImages(homes);
            List<Map<String, Object>> recommended = links.stream().map(link -> homes.stream()
                    .filter(h -> h.getId().equals(link.getHomestayId())).findFirst()
                    .map(h -> homestayResponse(h, images.get(h.getId()), link.getDistanceLabel())).orElse(null))
                    .filter(Objects::nonNull).toList();
            result.put("nearbyHomestays", recommended.size());
            result.put("homestayIds", links.stream().map(FestivalHomestay::getHomestayId).toList());
            result.put("distanceLabels", links.stream().map(FestivalHomestay::getDistanceLabel).toList());
            result.put("homestays", recommended);
        }
        return result;
    }

    private void saveRecommendations(Festival festival, FestivalRequest request) {
        List<Long> ids = request.getHomestayIds() == null ? List.of() : request.getHomestayIds().stream().filter(Objects::nonNull).distinct().toList();
        List<Homestay> homes = homestayRepository.findAllById(ids);
        if (homes.size() != ids.size()) throw new IllegalArgumentException("Có homestay được chọn không tồn tại.");
        for (int i = 0; i < ids.size(); i++) {
            final Long homeId = ids.get(i);
            Homestay home = homes.stream().filter(h -> h.getId().equals(homeId)).findFirst().orElseThrow();
            if (home.getCity() == null || !home.getCity().equalsIgnoreCase(festival.getCity()))
                throw new IllegalArgumentException("Homestay phải thuộc cùng tỉnh/thành phố với lễ hội.");
            FestivalHomestay link = new FestivalHomestay();
            link.setFestivalId(festival.getId()); link.setHomestayId(home.getId()); link.setDisplayOrder(i);
            List<String> labels = request.getDistanceLabels();
            link.setDistanceLabel(labels != null && i < labels.size() ? trimToNull(labels.get(i)) : null);
            festivalHomestayRepository.save(link);
        }
    }

    private Map<Long, String> primaryImages(List<Homestay> homes) {
        Set<Long> ids = homes.stream().map(Homestay::getId).collect(Collectors.toSet());
        Map<Long, String> result = new HashMap<>();
        if (ids.isEmpty()) return result;
        for (HomestayImage image : homestayImageRepository.findByHomestayIdIn(new ArrayList<>(ids))) {
            if (ids.contains(image.getHomestayId()) && Boolean.TRUE.equals(image.getIsPrimary())) result.putIfAbsent(image.getHomestayId(), image.getImageUrl());
        }
        return result;
    }

    private Map<String, Object> homestayResponse(Homestay h, String image, String distanceLabel) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", h.getId()); item.put("name", h.getName()); item.put("city", h.getCity()); item.put("address", h.getAddress());
        item.put("status", h.getStatus()); item.put("rating", h.getRating()); item.put("price", h.getBasePrice());
        item.put("imageUrl", image); item.put("distanceLabel", distanceLabel);
        return item;
    }

    private String status(Festival festival) {
        LocalDate today = LocalDate.now();
        LocalDate start = parseDate(festival.getStartDate()), end = parseDate(festival.getEndDate());
        if (end != null && end.isBefore(today)) return "ended";
        if (start != null && !start.isAfter(today)) return "active";
        return "upcoming";
    }

    private LocalDate parseDate(String value) {
        if (blank(value)) return null;
        try { return LocalDate.parse(value.trim()); }
        catch (DateTimeParseException ignored) {
            try { return LocalDate.parse(value.trim(), DateTimeFormatter.ofPattern("dd/MM/yyyy")); }
            catch (DateTimeParseException ignoredAgain) { return null; }
        }
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }
    private String trimToNull(String value) { return blank(value) ? null : value.trim(); }
}
