package vn.edu.hcmuaf.fit.springboot.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.HomestayImage;
import vn.edu.hcmuaf.fit.springboot.model.User;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayImageRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.UserRepository;

import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping({"/api/admin/homestays", "/api/public/admin/homestays"})
@CrossOrigin(origins = "*")
public class AdminHomestayController {

    @Autowired
    private HomestayRepository homestayRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HomestayImageRepository homestayImageRepository;

    @Autowired
    private vn.edu.hcmuaf.fit.springboot.repository.RoomRepository roomRepository;

    @Autowired
    private vn.edu.hcmuaf.fit.springboot.repository.RoomImageRepository roomImageRepository;

    private String resolveHomestayImage(Long homestayId, String city) {
        List<HomestayImage> images = homestayImageRepository.findByHomestayId(homestayId);
        if (images != null && !images.isEmpty()) {
            return images.stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .map(HomestayImage::getImageUrl)
                    .findFirst()
                    .orElse(images.get(0).getImageUrl());
        }

        try {
            List<vn.edu.hcmuaf.fit.springboot.model.Room> rooms = roomRepository.findByHomestayId(homestayId);
            if (rooms != null && !rooms.isEmpty()) {
                List<vn.edu.hcmuaf.fit.springboot.model.RoomImage> roomImgs = roomImageRepository.findByRoomId(rooms.get(0).getId());
                if (roomImgs != null && !roomImgs.isEmpty()) {
                    return roomImgs.get(0).getImageUrl();
                }
            }
        } catch (Exception e) {}

        if (city != null) {
            String c = city.toLowerCase();
            if (c.contains("đà lạt") || c.contains("da lat")) {
                return "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80";
            } else if (c.contains("đà nẵng") || c.contains("da nang")) {
                return "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80";
            } else if (c.contains("sapa") || c.contains("sa pa")) {
                return "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80";
            } else if (c.contains("hồ chí minh") || c.contains("hcm") || c.contains("sài gòn")) {
                return "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";
            }
        }
        return "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80";
    }

    @GetMapping
    public ResponseEntity<?> getAllHomestays() {
        List<Homestay> homestays = homestayRepository.findAll();
        List<User> allUsers = userRepository.findAll();

        Map<Long, User> userMap = allUsers.stream().collect(Collectors.toMap(User::getId, u -> u));

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));

        List<Map<String, Object>> result = homestays.stream().map(h -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", h.getId());
            map.put("code", "#HS-" + String.format("%04d", h.getId()));
            map.put("name", h.getName());
            
            User owner = userMap.get(h.getOwnerId());
            if (owner != null) {
                map.put("host", owner.getFullName());
                map.put("hostId", "USR" + String.format("%03d", owner.getId()));
                map.put("phone", owner.getPhoneNumber());
                map.put("email", owner.getEmail());
            } else {
                map.put("host", "N/A");
                map.put("hostId", "N/A");
                map.put("phone", "N/A");
                map.put("email", "N/A");
            }
            
            map.put("region", h.getCity() != null ? h.getCity() : "N/A");
            map.put("price", h.getBasePrice() != null ? nf.format(h.getBasePrice()) + "đ" : "N/A");
            map.put("date", h.getCreatedAt() != null ? h.getCreatedAt().format(dtf) : "N/A");
            
            String rawStatus = h.getStatus() != null ? h.getStatus().trim().toLowerCase() : "pending";
            String status = "pending";
            if (rawStatus.equals("active") || rawStatus.equals("approved") || rawStatus.equals("available")) status = "active";
            else if (rawStatus.equals("suspended") || rawStatus.equals("inactive") || rawStatus.equals("maintenance") || rawStatus.equals("locked")) status = "suspended";
            else if (rawStatus.equals("rejected") || rawStatus.equals("denied") || rawStatus.equals("deleted") || rawStatus.equals("canceled")) status = "rejected";
            
            map.put("status", status);
            
            String statusText = "Chờ duyệt";
            if (status.equals("active")) statusText = "Đang hoạt động";
            else if (status.equals("suspended")) statusText = "Tạm khóa";
            else if (status.equals("rejected")) statusText = "Bị từ chối";
            
            map.put("statusText", statusText);
            map.put("rooms", h.getNumRooms() != null ? h.getNumRooms() : 0);
            
            String imgUrl = resolveHomestayImage(h.getId(), h.getCity());
            map.put("img", imgUrl);
            
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHomestayById(@PathVariable Long id) {
        Optional<Homestay> opt = homestayRepository.findById(id);
        if (opt.isPresent()) {
            Homestay h = opt.get();
            Map<String, Object> map = new HashMap<>();
            map.put("id", h.getId());
            map.put("code", "#HS-" + String.format("%04d", h.getId()));
            map.put("name", h.getName());
            map.put("price", h.getBasePrice());
            map.put("rooms", h.getNumRooms());
            map.put("guests", h.getMaxGuests());
            map.put("description", h.getDescription());
            map.put("address", h.getAddress());
            map.put("city", h.getCity());

            DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            map.put("createdAt", h.getCreatedAt() != null ? h.getCreatedAt().format(dtf) : "N/A");
            map.put("rating", h.getRating() != null ? h.getRating() : 5.0);

            if (h.getOwnerId() != null) {
                userRepository.findById(h.getOwnerId()).ifPresent(owner -> {
                    map.put("hostName", owner.getFullName());
                    map.put("hostPhone", owner.getPhoneNumber());
                    map.put("hostEmail", owner.getEmail());
                });
            }

            String imgUrl = resolveHomestayImage(h.getId(), h.getCity());
            map.put("img", imgUrl);

            String rawStatus = h.getStatus() != null ? h.getStatus().trim().toLowerCase() : "pending";
            String status = "pending";
            if (rawStatus.equals("active") || rawStatus.equals("approved") || rawStatus.equals("available")) status = "active";
            else if (rawStatus.equals("suspended") || rawStatus.equals("inactive") || rawStatus.equals("maintenance") || rawStatus.equals("locked") || rawStatus.equals("temporarily_locked") || rawStatus.equals("tam_khoa") || rawStatus.equals("tạm khóa")) status = "suspended";
            else if (rawStatus.equals("rejected") || rawStatus.equals("denied") || rawStatus.equals("deleted") || rawStatus.equals("canceled")) status = "rejected";

            map.put("status", status);
            map.put("rawStatus", h.getStatus());
            
            return ResponseEntity.ok(map);
        } else {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Không tìm thấy Homestay"));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateHomestayStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Status is required"));
        }

        Optional<Homestay> opt = homestayRepository.findById(id);
        if (opt.isPresent()) {
            Homestay h = opt.get();
            String st = newStatus.trim();
            if ("suspended".equalsIgnoreCase(st) || "locked".equalsIgnoreCase(st) || "inactive".equalsIgnoreCase(st) || "tạm khóa".equalsIgnoreCase(st)) {
                h.setStatus("SUSPENDED");
            } else {
                h.setStatus(st.toUpperCase());
            }
            homestayRepository.save(h);
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật trạng thái thành công"));
        } else {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Không tìm thấy Homestay"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateHomestayDetails(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Optional<Homestay> opt = homestayRepository.findById(id);
        if (opt.isPresent()) {
            Homestay h = opt.get();
            if (payload.containsKey("name") && payload.get("name") != null) h.setName((String) payload.get("name"));
            if (payload.containsKey("price") && payload.get("price") != null && !payload.get("price").toString().trim().isEmpty()) {
                h.setBasePrice(new java.math.BigDecimal(payload.get("price").toString()));
            }
            if (payload.containsKey("rooms") && payload.get("rooms") != null && !payload.get("rooms").toString().trim().isEmpty()) {
                h.setNumRooms(Integer.valueOf(payload.get("rooms").toString()));
            }
            if (payload.containsKey("guests") && payload.get("guests") != null && !payload.get("guests").toString().trim().isEmpty()) {
                h.setMaxGuests(Integer.valueOf(payload.get("guests").toString()));
            }
            if (payload.containsKey("description") && payload.get("description") != null) h.setDescription((String) payload.get("description"));
            if (payload.containsKey("address") && payload.get("address") != null) h.setAddress((String) payload.get("address"));
            if (payload.containsKey("city") && payload.get("city") != null) h.setCity((String) payload.get("city"));
            if (payload.containsKey("status") && payload.get("status") != null) {
                String st = ((String) payload.get("status")).trim();
                if ("suspended".equalsIgnoreCase(st) || "locked".equalsIgnoreCase(st) || "inactive".equalsIgnoreCase(st) || "tạm khóa".equalsIgnoreCase(st)) {
                    h.setStatus("SUSPENDED");
                } else {
                    h.setStatus(st.toUpperCase());
                }
            }
            
            homestayRepository.save(h);

            // Save/Update Primary Homestay Image
            String imgUrl = null;
            if (payload.containsKey("img") && payload.get("img") != null) imgUrl = (String) payload.get("img");
            else if (payload.containsKey("image") && payload.get("image") != null) imgUrl = (String) payload.get("image");

            if (imgUrl != null && !imgUrl.trim().isEmpty()) {
                List<HomestayImage> existingImages = homestayImageRepository.findByHomestayId(h.getId());
                if (existingImages != null && !existingImages.isEmpty()) {
                    HomestayImage primaryImg = existingImages.get(0);
                    primaryImg.setImageUrl(imgUrl.trim());
                    primaryImg.setIsPrimary(true);
                    homestayImageRepository.save(primaryImg);
                } else {
                    HomestayImage newImg = HomestayImage.builder()
                            .homestayId(h.getId())
                            .imageUrl(imgUrl.trim())
                            .isPrimary(true)
                            .build();
                    homestayImageRepository.save(newImg);
                }
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật thông tin thành công"));
        } else {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Không tìm thấy Homestay"));
        }
    }

    @PostMapping
    public ResponseEntity<?> createHomestay(@RequestBody Map<String, Object> payload) {
        try {
            Homestay h = new Homestay();
            if (payload.containsKey("name") && payload.get("name") != null) h.setName((String) payload.get("name"));
            if (payload.containsKey("price") && payload.get("price") != null && !payload.get("price").toString().trim().isEmpty()) {
                h.setBasePrice(new java.math.BigDecimal(payload.get("price").toString()));
            } else {
                h.setBasePrice(new java.math.BigDecimal("890000"));
            }
            if (payload.containsKey("rooms") && payload.get("rooms") != null && !payload.get("rooms").toString().trim().isEmpty()) {
                h.setNumRooms(Integer.valueOf(payload.get("rooms").toString()));
            } else {
                h.setNumRooms(6);
            }
            if (payload.containsKey("guests") && payload.get("guests") != null && !payload.get("guests").toString().trim().isEmpty()) {
                h.setMaxGuests(Integer.valueOf(payload.get("guests").toString()));
            } else {
                h.setMaxGuests(10);
            }
            if (payload.containsKey("description") && payload.get("description") != null) h.setDescription((String) payload.get("description"));
            if (payload.containsKey("address") && payload.get("address") != null) h.setAddress((String) payload.get("address"));
            if (payload.containsKey("city") && payload.get("city") != null) h.setCity((String) payload.get("city"));
            
            if (payload.containsKey("categoryId") && payload.get("categoryId") != null && !payload.get("categoryId").toString().trim().isEmpty()) {
                h.setCategoryId(Long.valueOf(payload.get("categoryId").toString()));
            } else {
                h.setCategoryId(1L); // Default category_id 1 to prevent DB NOT NULL constraint violation
            }

            if (payload.containsKey("status") && payload.get("status") != null) {
                String st = ((String) payload.get("status")).trim();
                if ("suspended".equalsIgnoreCase(st) || "locked".equalsIgnoreCase(st) || "inactive".equalsIgnoreCase(st) || "tạm khóa".equalsIgnoreCase(st)) {
                    h.setStatus("SUSPENDED");
                } else {
                    h.setStatus(st.toUpperCase());
                }
            } else {
                h.setStatus("ACTIVE");
            }
            
            h.setCreatedAt(java.time.LocalDateTime.now());
            if (payload.containsKey("ownerId") && payload.get("ownerId") != null && !payload.get("ownerId").toString().trim().isEmpty()) {
                h.setOwnerId(Long.valueOf(payload.get("ownerId").toString()));
            } else {
                h.setOwnerId(1L); 
            }
            
            homestayRepository.save(h);

            // Save Image for new homestay
            String imgUrl = null;
            if (payload.containsKey("img") && payload.get("img") != null) imgUrl = (String) payload.get("img");
            else if (payload.containsKey("image") && payload.get("image") != null) imgUrl = (String) payload.get("image");

            if (imgUrl != null && !imgUrl.trim().isEmpty()) {
                HomestayImage newImg = HomestayImage.builder()
                        .homestayId(h.getId())
                        .imageUrl(imgUrl.trim())
                        .isPrimary(true)
                        .build();
                homestayImageRepository.save(newImg);
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Thêm homestay thành công", "id", h.getId()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Lỗi server: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHomestay(@PathVariable Long id) {
        Optional<Homestay> opt = homestayRepository.findById(id);
        if (opt.isPresent()) {
            homestayRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Xóa homestay thành công"));
        } else {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Không tìm thấy Homestay"));
        }
    }
}
