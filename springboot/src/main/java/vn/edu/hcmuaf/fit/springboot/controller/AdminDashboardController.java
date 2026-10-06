package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.AdminDashboardDTO.*;
import vn.edu.hcmuaf.fit.springboot.service.AdminDashboardService;

import java.util.List;

@RestController
@RequestMapping({"/api/admin/dashboard", "/api/public/admin/dashboard"})
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/overview")
    public ResponseEntity<OverviewResponse> getOverview(
            @RequestParam(name = "period", defaultValue = "month") String period) {
        return ResponseEntity.ok(adminDashboardService.getOverview(period));
    }

    @GetMapping("/recent-activities")
    public ResponseEntity<List<RecentActivityDTO>> getRecentActivities(
            @RequestParam(name = "status", defaultValue = "all") String status) {
        return ResponseEntity.ok(adminDashboardService.getRecentActivities(status));
    }

    @GetMapping("/metrics/{key}")
    public ResponseEntity<MetricDetailResponse> getMetricDetail(
            @PathVariable("key") String key,
            @RequestParam(name = "period", defaultValue = "month") String period) {
        return ResponseEntity.ok(adminDashboardService.getMetricDetail(key, period));
    }
}
