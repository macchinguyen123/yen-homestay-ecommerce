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
    private final CacheManager cacheManager;

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
    public ResponseEntity<List<Room>> getAllRooms() {
        List<Room> rooms = roomRepository.findAll();
        rooms.forEach(r -> {
            if (r.getRoomCode() == null || r.getRoomCode().trim().isEmpty()) {
                r.setRoomCode("P." + r.getId());
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

            clearAllCaches();
            log.info("Đã lưu phòng mới vào Neon CSDL: ID={}, Code={}, Name={}, HomestayId={}", saved.getId(), saved.getRoomCode(), saved.getRoomName(), saved.getHomestayId());
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

            clearAllCaches();
            log.info("Đã cập nhật phòng ID {} trong Neon CSDL: {}", updated.getId(), updated.getRoomName());
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping({"/api/admin/rooms/{id}", "/api/public/admin/rooms/{id}"})
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        try {
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
