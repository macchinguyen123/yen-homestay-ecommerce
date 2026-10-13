package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.AdminComplaintDTO.*;
import vn.edu.hcmuaf.fit.springboot.service.AdminComplaintService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/complaints")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AdminComplaintController {

    private final AdminComplaintService adminComplaintService;

    @GetMapping
    public ResponseEntity<List<Item>> getComplaints(
            @RequestParam(required = false, defaultValue = "all") String direction,
            @RequestParam(required = false, defaultValue = "all") String status,
            @RequestParam(required = false, defaultValue = "all") String severity,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(adminComplaintService.getComplaints(direction, status, severity, search));
    }

    @GetMapping("/stats")
    public ResponseEntity<Stats> getStats() {
        return ResponseEntity.ok(adminComplaintService.getStats());
    }

    @GetMapping("/bookings")
    public ResponseEntity<List<BookingOptionDTO>> getAvailableBookings() {
        return ResponseEntity.ok(adminComplaintService.getAvailableBookings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Item> getComplaintById(@PathVariable Long id) {
        return ResponseEntity.ok(adminComplaintService.getComplaintById(id));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<Item> resolveComplaint(
            @PathVariable Long id,
            @RequestBody ResolveRequest req
    ) {
        log.info("[AdminComplaintController] Resolving dispute id={} action={}", id, req.getAction());
        return ResponseEntity.ok(adminComplaintService.resolveComplaint(id, req));
    }

    @PostMapping
    public ResponseEntity<Item> createComplaint(@RequestBody CreateRequest req) {
        log.info("[AdminComplaintController] Creating new dispute direction={} title={}", req.getDirection(), req.getTitle());
        return ResponseEntity.ok(adminComplaintService.createComplaint(req));
    }
}
