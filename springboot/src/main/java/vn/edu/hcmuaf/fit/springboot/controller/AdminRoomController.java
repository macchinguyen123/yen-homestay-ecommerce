package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.model.Room;
import vn.edu.hcmuaf.fit.springboot.repository.RoomRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class AdminRoomController {

    private final RoomRepository roomRepository;
    private final vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository homestayRepository;
    private final vn.edu.hcmuaf.fit.springboot.repository.RoomImageRepository roomImageRepository;
    private final CacheManager cacheManager;

    private static final String[] CURATED_ROOM_IMAGES = new String[]{
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80"
    };

    private String resolveFallbackRoomImage(Long roomId, String roomType, String roomName) {
        if (roomType != null) {
            String t = roomType.toUpperCase();
            if (t.contains("FAMILY") || t.contains("GIA ĐÌNH")) {
                return "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80";
            } else if (t.contains("VILLA") || t.contains("PENTHOUSE")) {
                return "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80";
            } else if (t.contains("BUNGALOW")) {
                return "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80";
            } else if (t.contains("DORM") || t.contains("TẬP THỂ") || t.contains("NHÀ SÀN")) {
                return "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80";
            } else if (t.contains("MOUNTAIN") || t.contains("NÚI")) {
                return "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80";
            }
        }
        int idx = (int) (Math.abs(roomId != null ? roomId : 1) % CURATED_ROOM_IMAGES.length);
        return CURATED_ROOM_IMAGES[idx];
    }

    private void clearAllCaches() {
        try {
            if (cacheManager != null) {
                cacheManager.getCacheNames().forEach(name -> {
                    var c = cacheManager.getCache(name);
                    if (c != null) c.clear();
                });
            }
        } catch (Exception e) {
            log.warn("Không thể xóa cache: {}", e.getMessage());
        }
    }

    @GetMapping({"/api/admin/rooms", "/api/public/admin/rooms"})
    public ResponseEntity<List<Room>> getAllRooms(
            @RequestParam(value = "homestayId", required = false) Long homestayId,
            @RequestParam(value = "ownerId", required = false) Long ownerId) {
        List<Room> rooms;
        if (homestayId != null && homestayId > 0) {
            rooms = roomRepository.findByHomestayId(homestayId);
        } else if (ownerId != null && ownerId > 0) {
            List<vn.edu.hcmuaf.fit.springboot.model.Homestay> ownerHomestays = homestayRepository.findByOwnerId(ownerId);
            List<Long> hsIds = ownerHomestays.stream().map(vn.edu.hcmuaf.fit.springboot.model.Homestay::getId).collect(java.util.stream.Collectors.toList());
            if (hsIds.isEmpty()) {
                rooms = java.util.Collections.emptyList();
            } else {
                rooms = roomRepository.findAll().stream()
                        .filter(r -> r.getHomestayId() != null && hsIds.contains(r.getHomestayId()))
                        .collect(java.util.stream.Collectors.toList());
            }
        } else {
            rooms = roomRepository.findAll();
        }

        List<Long> roomIds = rooms.stream().map(Room::getId).collect(java.util.stream.Collectors.toList());
        List<vn.edu.hcmuaf.fit.springboot.model.RoomImage> allImages = roomIds.isEmpty()
                ? java.util.Collections.emptyList()
                : roomImageRepository.findByRoomIdIn(roomIds);
        Map<Long, List<vn.edu.hcmuaf.fit.springboot.model.RoomImage>> imagesByRoom = allImages.stream()
                .collect(java.util.stream.Collectors.groupingBy(vn.edu.hcmuaf.fit.springboot.model.RoomImage::getRoomId));

        rooms.forEach(r -> {
            if (r.getRoomCode() == null || r.getRoomCode().trim().isEmpty()) {
                r.setRoomCode("P." + r.getId());
            }
            List<vn.edu.hcmuaf.fit.springboot.model.RoomImage> rImages = imagesByRoom.getOrDefault(r.getId(), java.util.Collections.emptyList());
            String primaryUrl = rImages.stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                    .map(vn.edu.hcmuaf.fit.springboot.model.RoomImage::getImageUrl)
                    .findFirst()
                    .orElse(rImages.isEmpty() ? null : rImages.get(0).getImageUrl());

            if (primaryUrl == null || primaryUrl.trim().isEmpty()) {
                primaryUrl = resolveFallbackRoomImage(r.getId(), r.getRoomType(), r.getRoomName());
                try {
                    vn.edu.hcmuaf.fit.springboot.model.RoomImage savedImg = roomImageRepository.save(
                            vn.edu.hcmuaf.fit.springboot.model.RoomImage.builder()
                                    .roomId(r.getId())
                                    .imageUrl(primaryUrl)
                                    .isPrimary(true)
                                    .build()
                    );
                    rImages = List.of(savedImg);
                } catch (Exception e) {
                    log.warn("Không thể lưu ảnh tự động cho phòng {}: {}", r.getId(), e.getMessage());
                }
            }

            r.setPrimaryImage(primaryUrl);
            r.setThumb(primaryUrl);
            if (!rImages.isEmpty()) {
                r.setImages(rImages.stream().map(vn.edu.hcmuaf.fit.springboot.model.RoomImage::getImageUrl).collect(java.util.stream.Collectors.toList()));
            } else {
                r.setImages(List.of(primaryUrl));
            }
        });
        return ResponseEntity.ok(rooms);
    }

    @PostMapping({"/api/admin/rooms", "/api/public/admin/rooms"})
    public ResponseEntity<Room> createRoom(@RequestBody Map<String, Object> payload) {
        try {
            Long homestayId = payload.get("homestayId") != null ? Long.valueOf(payload.get("homestayId").toString()) : 1L;
            String roomName = payload.get("name") != null ? payload.get("name").toString() : (payload.get("roomName") != null ? payload.get("roomName").toString() : "Phòng mới");
            String roomCode = payload.get("code") != null ? payload.get("code").toString() : (payload.get("roomCode") != null ? payload.get("roomCode").toString() : null);
            String roomType = payload.get("type") != null ? payload.get("type").toString() : "Garden View";
            Integer capacity = payload.get("capacity") != null ? Integer.valueOf(payload.get("capacity").toString()) : 2;
            BigDecimal price = payload.get("price") != null ? new BigDecimal(payload.get("price").toString()) : new BigDecimal("850000");
            String status = payload.get("status") != null ? payload.get("status").toString().toUpperCase() : "AVAILABLE";

            Room room = Room.builder()
                    .homestayId(homestayId)
                    .roomName(roomName)
                    .roomType(roomType)
                    .capacity(capacity)
                    .bedCount(1)
                    .pricePerNight(price)
                    .status(status)
                    .roomCode(roomCode)
                    .build();

            Room saved = roomRepository.save(room);
            if (roomCode != null) saved.setRoomCode(roomCode);
            else saved.setRoomCode("P." + saved.getId());

            String imgUrl = payload.get("image") != null ? payload.get("image").toString()
                    : (payload.get("imageUrl") != null ? payload.get("imageUrl").toString()
                    : (payload.get("thumb") != null ? payload.get("thumb").toString() : null));

            if (imgUrl == null || imgUrl.trim().isEmpty()) {
                imgUrl = resolveFallbackRoomImage(saved.getId(), saved.getRoomType(), saved.getRoomName());
            }

            try {
                roomImageRepository.save(vn.edu.hcmuaf.fit.springboot.model.RoomImage.builder()
                        .roomId(saved.getId())
                        .imageUrl(imgUrl.trim())
                        .isPrimary(true)
                        .build());
            } catch (Exception e) {
                log.warn("Không thể lưu ảnh cho phòng mới {}: {}", saved.getId(), e.getMessage());
            }

            saved.setPrimaryImage(imgUrl.trim());
            saved.setThumb(imgUrl.trim());
            saved.setImages(List.of(imgUrl.trim()));

            clearAllCaches();
            log.info("Đã lưu phòng mới vào Neon CSDL: ID={}, Code={}, Name={}, HomestayId={}, Image={}",
                    saved.getId(), saved.getRoomCode(), saved.getRoomName(), saved.getHomestayId(), imgUrl);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            log.error("Lỗi khi tạo phòng mới trong CSDL Neon: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping({"/api/admin/rooms/{id}", "/api/public/admin/rooms/{id}"})
    public ResponseEntity<Room> updateRoom(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return roomRepository.findById(id).map(room -> {
            if (payload.containsKey("name")) room.setRoomName(payload.get("name").toString());
            if (payload.containsKey("roomName")) room.setRoomName(payload.get("roomName").toString());
            if (payload.containsKey("type")) room.setRoomType(payload.get("type").toString());
            if (payload.containsKey("capacity")) room.setCapacity(Integer.valueOf(payload.get("capacity").toString()));
            if (payload.containsKey("price")) room.setPricePerNight(new BigDecimal(payload.get("price").toString()));
            if (payload.containsKey("status")) room.setStatus(payload.get("status").toString().toUpperCase());
            if (payload.containsKey("code")) room.setRoomCode(payload.get("code").toString());
            if (payload.containsKey("roomCode")) room.setRoomCode(payload.get("roomCode").toString());

            Room updated = roomRepository.save(room);
            if (payload.containsKey("code")) updated.setRoomCode(payload.get("code").toString());
            else if (updated.getRoomCode() == null) updated.setRoomCode("P." + updated.getId());

            String newImg = payload.get("image") != null ? payload.get("image").toString()
                    : (payload.get("imageUrl") != null ? payload.get("imageUrl").toString()
                    : (payload.get("thumb") != null ? payload.get("thumb").toString() : null));

            if (newImg != null && !newImg.trim().isEmpty()) {
                try {
                    List<vn.edu.hcmuaf.fit.springboot.model.RoomImage> existing = roomImageRepository.findByRoomId(room.getId());
                    if (!existing.isEmpty()) {
                        vn.edu.hcmuaf.fit.springboot.model.RoomImage primary = existing.stream()
                                .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                                .findFirst()
                                .orElse(existing.get(0));
                        primary.setImageUrl(newImg.trim());
                        roomImageRepository.save(primary);
                    } else {
                        roomImageRepository.save(vn.edu.hcmuaf.fit.springboot.model.RoomImage.builder()
                                .roomId(room.getId())
                                .imageUrl(newImg.trim())
                                .isPrimary(true)
                                .build());
                    }
                } catch (Exception e) {
                    log.warn("Không thể cập nhật ảnh phòng ID {}: {}", room.getId(), e.getMessage());
                }
                updated.setPrimaryImage(newImg.trim());
                updated.setThumb(newImg.trim());
                updated.setImages(List.of(newImg.trim()));
            } else {
                List<vn.edu.hcmuaf.fit.springboot.model.RoomImage> existing = roomImageRepository.findByRoomId(room.getId());
                String pImg = existing.stream()
                        .filter(img -> Boolean.TRUE.equals(img.getIsPrimary()))
                        .map(vn.edu.hcmuaf.fit.springboot.model.RoomImage::getImageUrl)
                        .findFirst()
                        .orElse(existing.isEmpty() ? null : existing.get(0).getImageUrl());
                if (pImg == null) {
                    pImg = resolveFallbackRoomImage(updated.getId(), updated.getRoomType(), updated.getRoomName());
                }
                updated.setPrimaryImage(pImg);
                updated.setThumb(pImg);
                if (!existing.isEmpty()) {
                    updated.setImages(existing.stream().map(vn.edu.hcmuaf.fit.springboot.model.RoomImage::getImageUrl).collect(java.util.stream.Collectors.toList()));
                } else {
                    updated.setImages(List.of(pImg));
                }
            }

            clearAllCaches();
            log.info("Đã cập nhật phòng ID {} trong Neon CSDL: {}", updated.getId(), updated.getRoomName());
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping({"/api/admin/rooms/{id}", "/api/public/admin/rooms/{id}"})
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        try {
            try {
                List<vn.edu.hcmuaf.fit.springboot.model.RoomImage> imgs = roomImageRepository.findByRoomId(id);
                if (!imgs.isEmpty()) {
                    roomImageRepository.deleteAll(imgs);
                }
            } catch (Exception ignored) {}
            roomRepository.deleteById(id);
            clearAllCaches();
            log.info("Đã xóa phòng ID {} khỏi Neon CSDL", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Lỗi khi xóa phòng ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
