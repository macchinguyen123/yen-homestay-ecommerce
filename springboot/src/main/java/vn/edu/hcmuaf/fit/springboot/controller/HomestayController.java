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
    public ResponseEntity<List<HomestayDTO>> getAllHomestays(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "city", required = false) String city) {
        String keyword = query != null ? query : (search != null ? search : city);
        if (keyword != null && !keyword.trim().isEmpty()) {
            return ResponseEntity.ok(roomService.searchHomestaysFromDb(keyword.trim()));
        }
        return ResponseEntity.ok(roomService.getAllHomestaysWithRooms());
    }

    @GetMapping("/search")
    public ResponseEntity<List<HomestayDTO>> searchHomestays(
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "keyword", required = false) String keyword) {
        String term = query != null ? query : keyword;
        if (term != null && !term.trim().isEmpty()) {
            return ResponseEntity.ok(roomService.searchHomestaysFromDb(term.trim()));
        }
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
