package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.RoomDTO;
import vn.edu.hcmuaf.fit.springboot.service.RoomService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/rooms")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    public ResponseEntity<List<RoomDTO>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RoomDTO> getRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoomById(id));
    }

    @GetMapping("/homestay/{homestayId}")
    public ResponseEntity<List<RoomDTO>> getRoomsByHomestayId(@PathVariable Long homestayId) {
        return ResponseEntity.ok(roomService.getRoomsByHomestayId(homestayId));
    }

    @PostMapping("/seed")
    public ResponseEntity<Map<String, Object>> seedData() {
        roomService.seedRealDataIfEmpty();
        return ResponseEntity.ok(Map.of(
                "status", "SUCCESS",
                "message", "Đã đồng bộ và khởi tạo các phòng thật vào database!",
                "totalRooms", roomService.getAllRooms().size()
        ));
    }
}
