package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.AdminReportDTO.*;
import vn.edu.hcmuaf.fit.springboot.service.AdminReportService;

@RestController
@RequestMapping({"/api/admin/reports", "/api/public/admin/reports"})
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminReportController {

    private final AdminReportService adminReportService;

    @GetMapping("/summary")
    public ResponseEntity<ReportSummaryResponse> getReportSummary(
            @RequestParam(name = "period", defaultValue = "30days") String period,
            @RequestParam(name = "startDate", required = false) String startDate,
            @RequestParam(name = "endDate", required = false) String endDate) {
        return ResponseEntity.ok(adminReportService.getReportSummary(period, startDate, endDate));
    }
}
