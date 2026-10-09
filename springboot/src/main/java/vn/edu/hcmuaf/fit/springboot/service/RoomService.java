package vn.edu.hcmuaf.fit.springboot.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.dto.HomestayDTO;
import vn.edu.hcmuaf.fit.springboot.dto.RoomDTO;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.HomestayImage;
import vn.edu.hcmuaf.fit.springboot.model.Room;
import vn.edu.hcmuaf.fit.springboot.model.RoomImage;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayImageRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.RoomImageRepository;
import vn.edu.hcmuaf.fit.springboot.repository.RoomRepository;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomImageRepository roomImageRepository;
    private final HomestayRepository homestayRepository;
    private final HomestayImageRepository homestayImageRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        try {
            seedRealDataIfEmpty();
        } catch (Exception e) {
            log.warn("Không thể tự động khởi tạo dữ liệu phòng/homestay: {}", e.getMessage());
        }
    }

    /**
     * Lấy toàn bộ danh sách phòng từ Database
     */
    @Cacheable("allRooms")
    public List<RoomDTO> getAllRooms() {
        List<Room> rooms = roomRepository.findAll();
        Map<Long, String> homestayNames = homestayRepository.findAll().stream()
                .collect(Collectors.toMap(Homestay::getId, Homestay::getName, (a, b) -> a));
        List<RoomImage> allImages = roomImageRepository.findAll();
        Map<Long, List<RoomImage>> imagesByRoom = allImages.stream()
                .collect(Collectors.groupingBy(RoomImage::getRoomId));

        return rooms.stream()
                .map(r -> toRoomDTOWithImages(r, homestayNames.get(r.getHomestayId()), imagesByRoom.getOrDefault(r.getId(), Collections.emptyList()), null))
                .collect(Collectors.toList());
    }

    /**
     * Lấy chi tiết 1 phòng theo ID từ Database
     */
    @Cacheable(value = "roomDetail", key = "#id")
    public RoomDTO getRoomById(Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng với ID: " + id));
        String homestayName = homestayRepository.findById(room.getHomestayId())
                .map(Homestay::getName).orElse("Homestay");
        return toRoomDTO(room, homestayName);
    }

    @lombok.Getter
    @lombok.AllArgsConstructor
    public static class ReviewSummary {
        private final int count;
        private final double avgRating;
    }

    private ReviewSummary getHomestayReviewStat(Long homestayId) {
        try {
            return jdbcTemplate.query(
                "SELECT COUNT(*) AS cnt, AVG(rating) AS avg_rating FROM reviews WHERE homestay_id = ?",
                rs -> {
                    if (rs.next()) {
                        int cnt = rs.getInt("cnt");
                        double avg = rs.getDouble("avg_rating");
                        return new ReviewSummary(cnt, Math.round(avg * 10.0) / 10.0);
                    }
                    return new ReviewSummary(0, 5.0);
                },
                homestayId
            );
        } catch (Exception e) {
            log.warn("Lỗi truy vấn thống kê reviews homestay {}: {}", homestayId, e.getMessage());
            return new ReviewSummary(0, 5.0);
        }
    }

    private Map<Long, ReviewSummary> getRoomReviewStatsForHomestay(Long homestayId) {
        Map<Long, ReviewSummary> map = new HashMap<>();
        try {
            jdbcTemplate.query(
                "SELECT b.room_id, COUNT(*) AS cnt, AVG(r.rating) AS avg_rating FROM reviews r JOIN bookings b ON r.booking_id = b.booking_id WHERE b.homestay_id = ? AND b.room_id IS NOT NULL GROUP BY b.room_id",
                rs -> {
                    long rId = rs.getLong("room_id");
                    int cnt = rs.getInt("cnt");
                    double avg = rs.getDouble("avg_rating");
                    map.put(rId, new ReviewSummary(cnt, Math.round(avg * 10.0) / 10.0));
                },
                homestayId
            );
        } catch (Exception e) {
            log.warn("Lỗi truy vấn thống kê reviews phòng của homestay {}: {}", homestayId, e.getMessage());
        }
        return map;
    }

    private Map<Long, ReviewSummary> getHomestayReviewStatsMap() {
        Map<Long, ReviewSummary> map = new HashMap<>();
        try {
            jdbcTemplate.query(
                "SELECT homestay_id, COUNT(*) AS cnt, AVG(rating) AS avg_rating FROM reviews GROUP BY homestay_id",
                rs -> {
                    long hId = rs.getLong("homestay_id");
                    int cnt = rs.getInt("cnt");
                    double avg = rs.getDouble("avg_rating");
                    map.put(hId, new ReviewSummary(cnt, Math.round(avg * 10.0) / 10.0));
                }
            );
        } catch (Exception e) {
            log.warn("Lỗi truy vấn thống kê reviews homestay: {}", e.getMessage());
        }
        return map;
    }

    private Map<Long, ReviewSummary> getRoomReviewStatsMap() {
        Map<Long, ReviewSummary> map = new HashMap<>();
        try {
            jdbcTemplate.query(
                "SELECT b.room_id, COUNT(*) AS cnt, AVG(r.rating) AS avg_rating FROM reviews r JOIN bookings b ON r.booking_id = b.booking_id WHERE b.room_id IS NOT NULL GROUP BY b.room_id",
                rs -> {
                    long rId = rs.getLong("room_id");
                    int cnt = rs.getInt("cnt");
                    double avg = rs.getDouble("avg_rating");
                    map.put(rId, new ReviewSummary(cnt, Math.round(avg * 10.0) / 10.0));
                }
            );
        } catch (Exception e) {
            log.warn("Lỗi truy vấn thống kê reviews phòng: {}", e.getMessage());
        }
        return map;
    }

    /**
     * Lấy danh sách phòng thuộc về 1 Homestay (tối ưu nạp ảnh và review)
     */
    @Cacheable(value = "homestayRooms", key = "#homestayId")
    public List<RoomDTO> getRoomsByHomestayId(Long homestayId) {
        List<Room> rooms = roomRepository.findByHomestayId(homestayId);
        String homestayName = homestayRepository.findById(homestayId)
                .map(Homestay::getName).orElse("Homestay");
        List<Long> roomIds = rooms.stream().map(Room::getId).collect(Collectors.toList());
        List<RoomImage> roomImages = roomIds.isEmpty() ? Collections.emptyList() : roomImageRepository.findByRoomIdIn(roomIds);
        Map<Long, List<RoomImage>> imagesByRoom = roomImages.stream()
                .collect(Collectors.groupingBy(RoomImage::getRoomId));
        Map<Long, ReviewSummary> roomReviewStats = getRoomReviewStatsForHomestay(homestayId);

        return rooms.stream()
                .map(r -> toRoomDTOWithImages(r, homestayName, imagesByRoom.getOrDefault(r.getId(), Collections.emptyList()), roomReviewStats.get(r.getId())))
                .collect(Collectors.toList());
    }

    /**
     * Lấy toàn bộ danh sách Homestay kèm các phòng thực tế từ Database
     */
    @Cacheable("allHomestays")
    public List<HomestayDTO> getAllHomestaysWithRooms() {
        List<Homestay> homestays = homestayRepository.findAll();
        List<Room> allRooms = roomRepository.findAll();
        List<RoomImage> allRoomImages = roomImageRepository.findAll();
        List<HomestayImage> allHomestayImages = homestayImageRepository.findAll();

        Map<Long, ReviewSummary> hsReviewStats = getHomestayReviewStatsMap();
        Map<Long, ReviewSummary> roomReviewStats = getRoomReviewStatsMap();

        Map<Long, List<Room>> roomsByHomestay = allRooms.stream()
                .collect(Collectors.groupingBy(Room::getHomestayId));
        Map<Long, List<RoomImage>> imagesByRoom = allRoomImages.stream()
                .collect(Collectors.groupingBy(RoomImage::getRoomId));
        Map<Long, List<HomestayImage>> imagesByHomestay = allHomestayImages.stream()
                .collect(Collectors.groupingBy(HomestayImage::getHomestayId));

        return homestays.stream()
                .map(h -> {
                    List<Room> rooms = roomsByHomestay.getOrDefault(h.getId(), Collections.emptyList());
                    List<RoomDTO> roomDTOs = rooms.stream()
                            .map(r -> toRoomDTOWithImages(r, h.getName(), imagesByRoom.getOrDefault(r.getId(), Collections.emptyList()), roomReviewStats.get(r.getId())))
                            .collect(Collectors.toList());

                    List<HomestayImage> hImages = imagesByHomestay.getOrDefault(h.getId(), Collections.emptyList());
                    return toHomestayDTO(h, roomDTOs, hImages, hsReviewStats.get(h.getId()));
                })
                .collect(Collectors.toList());
    }

    /**
     * Lấy thông tin 1 Homestay kèm các phòng từ Database
     */
    @Cacheable(value = "homestayDetail", key = "#id")
    public HomestayDTO getHomestayById(Long id) {
        Homestay h = homestayRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy homestay với ID: " + id));
        List<RoomDTO> roomDTOs = getRoomsByHomestayId(id);
        List<HomestayImage> hImages = homestayImageRepository.findByHomestayId(id);
        ReviewSummary hsStat = getHomestayReviewStat(id);
        return toHomestayDTO(h, roomDTOs, hImages, hsStat);
    }

    /**
     * Map Entity Room sang RoomDTO
     */
    private RoomDTO toRoomDTO(Room r, String homestayName) {
        List<RoomImage> images = roomImageRepository.findByRoomId(r.getId());
        return toRoomDTOWithImages(r, homestayName, images, null);
    }

    private RoomDTO toRoomDTOWithImages(Room r, String homestayName, List<RoomImage> images, ReviewSummary revStat) {
        List<String> imageUrls = images.stream().map(RoomImage::getImageUrl).collect(Collectors.toList());
        if (imageUrls.isEmpty()) {
            imageUrls = getDefaultImagesForRoomType(r.getRoomType());
        }

        String primaryImg = images.stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .map(RoomImage::getImageUrl)
                .findFirst()
                .orElse(imageUrls.get(0));

        int areaM2 = 25 + (r.getCapacity() != null ? r.getCapacity() * 5 : 10);
        String bedsDesc = (r.getBedCount() != null ? r.getBedCount() : 1) + " giường";
        if ("DOUBLE".equalsIgnoreCase(r.getRoomType())) bedsDesc = "1 giường đôi lớn";
        else if ("FAMILY".equalsIgnoreCase(r.getRoomType())) bedsDesc = "1 giường đôi + 2 giường đơn";
        else if ("VILLA".equalsIgnoreCase(r.getRoomType())) bedsDesc = "3 phòng ngủ · 4 giường";

        int roomRevCount = 0;
        double roomRating = 5.0;
        if (revStat != null) {
            roomRevCount = revStat.getCount();
            roomRating = revStat.getCount() > 0 ? revStat.getAvgRating() : 5.0;
        }

        return RoomDTO.builder()
                .id(r.getId())
                .homestayId(r.getHomestayId())
                .homestayName(homestayName)
                .roomName(r.getRoomName())
                .name(r.getRoomName())
                .roomType(r.getRoomType())
                .bedCount(r.getBedCount())
                .capacity(r.getCapacity())
                .pricePerNight(r.getPricePerNight())
                .price(r.getPricePerNight())
                .cleaningFee(BigDecimal.valueOf(100000))
                .status(r.getStatus() != null ? r.getStatus() : "AVAILABLE")
                .availableCount(r.getStatus() != null && r.getStatus().equalsIgnoreCase("AVAILABLE") ? 2 : 0)
                .description(generateRoomDescription(r))
                .thumb(primaryImg)
                .primaryImage(primaryImg)
                .gallery(imageUrls)
                .images(imageUrls)
                .amenities(generateRoomAmenities(r.getRoomType()))
                .specs(RoomDTO.RoomSpecsDTO.builder()
                        .area(areaM2 + "m²")
                        .guests(r.getCapacity() != null ? r.getCapacity() : 2)
                        .beds(bedsDesc)
                        .build())
                .rating(roomRating)
                .reviewCount(roomRevCount)
                .build();
    }

    private HomestayDTO toHomestayDTO(Homestay h, List<RoomDTO> rooms, List<HomestayImage> hImages) {
        return toHomestayDTO(h, rooms, hImages, null);
    }

    private HomestayDTO toHomestayDTO(Homestay h, List<RoomDTO> rooms, List<HomestayImage> hImages, ReviewSummary hsStat) {
        List<String> imageUrls = hImages.stream().map(HomestayImage::getImageUrl).collect(Collectors.toList());
        if (imageUrls.isEmpty()) {
            imageUrls = getDefaultImagesForHomestay(h.getCity());
        }

        String primaryImg = hImages.stream()
                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                .map(HomestayImage::getImageUrl)
                .findFirst()
                .orElse(imageUrls.get(0));

        Long defaultRoomId = !rooms.isEmpty() ? rooms.get(0).getId() : null;
        BigDecimal minPrice = !rooms.isEmpty()
                ? rooms.stream().map(RoomDTO::getPricePerNight).min(BigDecimal::compareTo).orElse(h.getBasePrice())
                : (h.getBasePrice() != null ? h.getBasePrice() : BigDecimal.valueOf(890000));

        int hsRevCount = 0;
        double hsRating = h.getRating() != null ? h.getRating() : 5.0;
        if (hsStat != null) {
            hsRevCount = hsStat.getCount();
            hsRating = hsStat.getCount() > 0 ? hsStat.getAvgRating() : (h.getRating() != null ? h.getRating() : 5.0);
        }

        return HomestayDTO.builder()
                .id(h.getId())
                .ownerId(h.getOwnerId())
                .categoryId(h.getCategoryId())
                .name(h.getName())
                .city(h.getCity())
                .address(h.getAddress())
                .location(h.getAddress() != null ? h.getAddress() : h.getCity())
                .distance("Cách trung tâm 1.2km")
                .maxGuests(h.getMaxGuests() != null ? h.getMaxGuests() : 4)
                .numRooms(h.getNumRooms() != null ? h.getNumRooms() : rooms.size())
                .basePrice(minPrice)
                .price(minPrice)
                .description(h.getDescription())
                .desc(h.getDescription())
                .rating(hsRating)
                .reviewCount(hsRevCount)
                .reviews(hsRevCount)
                .stars(5)
                .locationScore(String.format("Địa điểm %.1f", hsRating).replace('.', ','))
                .status(h.getStatus())
                .image(primaryImg)
                .primaryImage(primaryImg)
                .images(imageUrls)
                .gallery(imageUrls)
                .services(List.of("Ăn sáng bản địa", "Đưa đón sân bay", "Thuê xe máy", "Tour săn mây"))
                .roomAmenities(List.of("Ban công view đẹp", "Bồn tắm gỗ", "Lò sưởi ấm", "Bếp riêng"))
                .amenities(List.of("Wifi tốc độ cao", "Bãi đậu xe", "Hồ bơi", "Sân nướng BBQ"))
                .travelGroups(List.of("Cặp đôi", "Gia đình", "Nhóm bạn"))
                .rooms(rooms)
                .defaultRoomId(defaultRoomId)
                .build();
    }

    private List<String> getDefaultImagesForRoomType(String type) {
        if ("FAMILY".equalsIgnoreCase(type)) {
            return List.of(
                    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
            );
        } else if ("VILLA".equalsIgnoreCase(type) || "PENTHOUSE".equalsIgnoreCase(type)) {
            return List.of(
                    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
                    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"
            );
        }
        return List.of(
                "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80"
        );
    }

    private List<String> getDefaultImagesForHomestay(String city) {
        return List.of(
                "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
                "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80"
        );
    }

    private String generateRoomDescription(Room r) {
        return "Không gian " + r.getRoomName() + " được thiết kế thoáng đãng, ấm cúng và đầy đủ tiện nghi tiêu chuẩn cao cấp, phù hợp cho "
                + (r.getCapacity() != null ? r.getCapacity() : 2) + " khách nghỉ dưỡng.";
    }

    private List<String> generateRoomAmenities(String roomType) {
        List<String> list = new ArrayList<>(List.of("Wifi tốc độ cao", "Máy điều hòa / Máy sưởi", "Phòng tắm riêng", "Máy sấy tóc", "Nước suối miễn phí"));
        if ("FAMILY".equalsIgnoreCase(roomType)) {
            list.add("Bếp mini nấu nướng");
            list.add("Tủ lạnh riêng");
        } else if ("VILLA".equalsIgnoreCase(roomType)) {
            list.add("Bồn tắm ngâm thảo mộc");
            list.add("Ban công Panorama toàn cảnh");
            list.add("Lò sưởi củi ấm áp");
        } else {
            list.add("Ban công ngắm cảnh");
        }
        return list;
    }

    /**
     * Khởi tạo dữ liệu thực tế vào Database nếu bảng rooms đang trống
     */
    @Transactional
    public void seedRealDataIfEmpty() {
        long roomCount = roomRepository.count();
        if (roomCount > 0) {
            log.info("Database đã có {} phòng thật, không cần seed lại.", roomCount);
            return;
        }

        log.info("Bắt đầu khởi tạo dữ liệu phòng và homestay thật vào Neon PostgreSQL Database...");

        // Kiểm tra hoặc tạo các Homestays chuẩn
        List<Homestay> existingHomestays = homestayRepository.findAll();
        Map<String, Homestay> hsMap = new HashMap<>();

        if (existingHomestays.isEmpty()) {
            Homestay h1 = homestayRepository.save(Homestay.builder()
                    .ownerId(1L).name("The Pine Hill Retreat Đà Lạt").city("Đà Lạt")
                    .address("Phường 3, TP. Đà Lạt, Lâm Đồng").maxGuests(8).numRooms(3)
                    .basePrice(BigDecimal.valueOf(890000)).rating(4.90).status("ACTIVE")
                    .description("Ẩn mình giữa đồi thông Đà Lạt, The Pine Hill Retreat mang đến không gian nghỉ dưỡng mộc mạc mà ấm cúng.").build());

            Homestay h2 = homestayRepository.save(Homestay.builder()
                    .ownerId(1L).name("A&L Service Apartment - Rivergate Residence").city("TP. Hồ Chí Minh")
                    .address("Quận 4, TP. Hồ Chí Minh (Bach Dang Riverside)").maxGuests(4).numRooms(2)
                    .basePrice(BigDecimal.valueOf(1250000)).rating(4.85).status("ACTIVE")
                    .description("Tọa lạc cách Bến cảng Nhà Rồng 16 phút đi bộ, cung cấp chỗ nghỉ có hồ bơi ngoài trời và dịch vụ phòng.").build());

            Homestay h3 = homestayRepository.save(Homestay.builder()
                    .ownerId(1L).name("OlaStay Serviced Apartments Free Pool").city("TP. Hồ Chí Minh")
                    .address("Quận 4, TP. Hồ Chí Minh (Bach Dang Riverside)").maxGuests(4).numRooms(2)
                    .basePrice(BigDecimal.valueOf(1680000)).rating(5.0).status("ACTIVE")
                    .description("Tọa lạc ở TP. Hồ Chí Minh, cung cấp chỗ nghỉ có hồ bơi ngoài trời mở quanh năm.").build());

            Homestay h4 = homestayRepository.save(Homestay.builder()
                    .ownerId(1L).name("Han River Glass House Đà Nẵng").city("Đà Nẵng")
                    .address("Bờ sông Hàn, Quận Hải Châu, Đà Nẵng").maxGuests(4).numRooms(2)
                    .basePrice(BigDecimal.valueOf(1150000)).rating(4.90).status("ACTIVE")
                    .description("Căn hộ panorama mặt kính view trọn bờ sông Hàn và cầu Rồng phun lửa.").build());

            Homestay h5 = homestayRepository.save(Homestay.builder()
                    .ownerId(1L).name("Topas Ecolodge Sapa Homestay").city("Sa Pa")
                    .address("Thung lũng Mường Hoa, Sa Pa, Lào Cai").maxGuests(4).numRooms(2)
                    .basePrice(BigDecimal.valueOf(4590000)).rating(4.95).status("ACTIVE")
                    .description("Bungalow đá tự nhiên nằm trên đỉnh đồi nhìn thẳng ra thung lũng Mường Hoa.").build());

            hsMap.put("h1", h1);
            hsMap.put("h2", h2);
            hsMap.put("h3", h3);
            hsMap.put("h4", h4);
            hsMap.put("h5", h5);
        } else {
            for (int i = 0; i < existingHomestays.size(); i++) {
                hsMap.put("h" + (i + 1), existingHomestays.get(i));
            }
        }

        Homestay h1 = hsMap.getOrDefault("h1", existingHomestays.get(0));
        Homestay h2 = hsMap.getOrDefault("h2", h1);
        Homestay h3 = hsMap.getOrDefault("h3", h1);
        Homestay h4 = hsMap.getOrDefault("h4", h1);
        Homestay h5 = hsMap.getOrDefault("h5", h1);

        // Tạo danh sách phòng thực tế
        List<Room> roomsToSave = List.of(
                // Homestay 1 (Pine Hill Retreat Đà Lạt)
                Room.builder().homestayId(h1.getId()).roomName("Phòng Đôi View Rừng Thông")
                        .roomType("DOUBLE").bedCount(1).capacity(2).pricePerNight(BigDecimal.valueOf(890000)).status("AVAILABLE").build(),
                Room.builder().homestayId(h1.getId()).roomName("Phòng Gác Mái Gia Đình")
                        .roomType("FAMILY").bedCount(3).capacity(4).pricePerNight(BigDecimal.valueOf(1350000)).status("AVAILABLE").build(),
                Room.builder().homestayId(h1.getId()).roomName("Villa Toàn Căn Đồi Thông")
                        .roomType("VILLA").bedCount(4).capacity(8).pricePerNight(BigDecimal.valueOf(2890000)).status("AVAILABLE").build(),

                // Homestay 2 (A&L Service Apartment HCM)
                Room.builder().homestayId(h2.getId()).roomName("Studio View Sông Bến Vân Đồn")
                        .roomType("STUDIO").bedCount(1).capacity(2).pricePerNight(BigDecimal.valueOf(1250000)).status("AVAILABLE").build(),
                Room.builder().homestayId(h2.getId()).roomName("Căn hộ 2PN Rivergate Residence")
                        .roomType("FAMILY").bedCount(2).capacity(4).pricePerNight(BigDecimal.valueOf(2150000)).status("AVAILABLE").build(),

                // Homestay 3 (OlaStay HCM)
                Room.builder().homestayId(h3.getId()).roomName("Phòng Deluxe Double Pool View")
                        .roomType("DOUBLE").bedCount(1).capacity(2).pricePerNight(BigDecimal.valueOf(1680000)).status("AVAILABLE").build(),
                Room.builder().homestayId(h3.getId()).roomName("Penthouse Panorama Rivergate")
                        .roomType("VILLA").bedCount(3).capacity(6).pricePerNight(BigDecimal.valueOf(3450000)).status("AVAILABLE").build(),

                // Homestay 4 (Han River Glass House Đà Nẵng)
                Room.builder().homestayId(h4.getId()).roomName("Studio Panorama View Sông Hàn")
                        .roomType("STUDIO").bedCount(1).capacity(2).pricePerNight(BigDecimal.valueOf(1150000)).status("AVAILABLE").build(),
                Room.builder().homestayId(h4.getId()).roomName("Căn Hộ Mặt Kính Gia Đình")
                        .roomType("FAMILY").bedCount(2).capacity(4).pricePerNight(BigDecimal.valueOf(1850000)).status("AVAILABLE").build(),

                // Homestay 5 (Topas Ecolodge Sapa)
                Room.builder().homestayId(h5.getId()).roomName("Bungalow Thung Lũng Mây")
                        .roomType("BUNGALOW").bedCount(1).capacity(2).pricePerNight(BigDecimal.valueOf(4590000)).status("AVAILABLE").build(),
                Room.builder().homestayId(h5.getId()).roomName("Bungalow Ruộng Bậc Thang Deluxe")
                        .roomType("BUNGALOW").bedCount(2).capacity(4).pricePerNight(BigDecimal.valueOf(5890000)).status("AVAILABLE").build()
        );

        List<Room> savedRooms = roomRepository.saveAll(roomsToSave);
        log.info("Đã lưu thành công {} phòng thật vào bảng rooms!", savedRooms.size());

        // Lưu ảnh cho từng phòng
        List<RoomImage> imagesToSave = new ArrayList<>();
        for (Room room : savedRooms) {
            List<String> urls = getDefaultImagesForRoomType(room.getRoomType());
            for (int i = 0; i < urls.size(); i++) {
                imagesToSave.add(RoomImage.builder()
                        .roomId(room.getId())
                        .imageUrl(urls.get(i))
                        .isPrimary(i == 0)
                        .build());
            }
        }
        roomImageRepository.saveAll(imagesToSave);
        log.info("Đã lưu thành công {} ảnh phòng vào bảng room_images!", imagesToSave.size());
    }
}
