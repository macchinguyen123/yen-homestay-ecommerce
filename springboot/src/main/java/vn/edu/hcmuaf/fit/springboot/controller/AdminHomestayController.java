package vn.edu.hcmuaf.fit.springboot.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/admin/homestays")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminHomestayController {

    @Autowired
    private HomestayRepository homestayRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HomestayImageRepository homestayImageRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllHomestays() {
        List<Homestay> homestays = homestayRepository.findAll();
        List<HomestayImage> allImages = homestayImageRepository.findAll();
        List<User> allUsers = userRepository.findAll();

        Map<Long, User> userMap = allUsers.stream().collect(Collectors.toMap(User::getId, u -> u));
        Map<Long, String> primaryImageMap = new HashMap<>();

        for (HomestayImage img : allImages) {
            if (img.getIsPrimary() != null && img.getIsPrimary() && !primaryImageMap.containsKey(img.getHomestayId())) {
                primaryImageMap.put(img.getHomestayId(), img.getImageUrl());
            }
        }
        for (HomestayImage img : allImages) {
            if (!primaryImageMap.containsKey(img.getHomestayId())) {
                primaryImageMap.put(img.getHomestayId(), img.getImageUrl());
            }
        }

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
            
            String imgUrl = primaryImageMap.get(h.getId());
            if (imgUrl == null || imgUrl.isEmpty()) {
                imgUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80"; // fallback
            }
            map.put("img", imgUrl);
            
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateHomestayStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        if (newStatus == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Status is required"));
        }

        Optional<Homestay> opt = homestayRepository.findById(id);
        if (opt.isPresent()) {
            Homestay h = opt.get();
            h.setStatus(newStatus.toUpperCase());
            homestayRepository.save(h);
            return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật trạng thái thành công"));
        } else {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Không tìm thấy Homestay"));
        }
    }
}
