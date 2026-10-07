package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.HomestayDTO;
import vn.edu.hcmuaf.fit.springboot.dto.RoomDTO;
import vn.edu.hcmuaf.fit.springboot.service.RoomService;

import java.util.List;

@RestController
@RequestMapping("/api/public/homestays")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class HomestayController {

    private final RoomService roomService;

    @GetMapping
    public ResponseEntity<List<HomestayDTO>> getAllHomestays() {
        return ResponseEntity.ok(roomService.getAllHomestaysWithRooms());
    }

    @GetMapping("/{id}")
    public ResponseEntity<HomestayDTO> getHomestayById(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getHomestayById(id));
    }

    @GetMapping("/{id}/rooms")
    public ResponseEntity<List<RoomDTO>> getRoomsByHomestay(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoomsByHomestayId(id));
    }
}
