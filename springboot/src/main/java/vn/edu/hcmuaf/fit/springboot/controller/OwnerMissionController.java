package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerMissionDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerMissionRequests.*;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerMissionStatsDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerMissionStatsDTO.RewardStockDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerSubmissionDTO;
import vn.edu.hcmuaf.fit.springboot.service.OwnerMissionService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/owner/missions", "/api/public/owner/missions"})
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class OwnerMissionController {

    private final OwnerMissionService ownerMissionService;

    /**
     * Lấy danh sách nhiệm vụ đang có
     */
    @GetMapping
    public ResponseEntity<List<OwnerMissionDTO>> getMissions(
            @RequestParam(value = "homestayId", required = false) Long homestayId) {
        return ResponseEntity.ok(ownerMissionService.getMissions(homestayId));
    }

    /**
     * Tạo nhiệm vụ mới
     */
    @PostMapping
    public ResponseEntity<OwnerMissionDTO> createMission(@RequestBody CreateMissionRequest req) {
        return ResponseEntity.ok(ownerMissionService.createMission(req));
    }

    /**
     * Cập nhật nhiệm vụ
     */
    @PutMapping("/{id}")
    public ResponseEntity<OwnerMissionDTO> updateMission(
            @PathVariable Long id,
            @RequestBody CreateMissionRequest req) {
        return ResponseEntity.ok(ownerMissionService.updateMission(id, req));
    }

    /**
     * Bật / tắt (Pause / Active) trạng thái nhiệm vụ
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<OwnerMissionDTO> toggleMissionStatus(@PathVariable Long id) {
        return ResponseEntity.ok(ownerMissionService.toggleMissionStatus(id));
    }

    /**
     * Xóa nhiệm vụ
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMission(@PathVariable Long id) {
        ownerMissionService.deleteMission(id);
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Đã xóa nhiệm vụ thành công");
        return ResponseEntity.ok(res);
    }

    /**
     * Lấy danh sách bài nộp của khách (chờ duyệt, đã duyệt, từ chối, yêu cầu chụp lại)
     */
    @GetMapping("/submissions")
    public ResponseEntity<List<OwnerSubmissionDTO>> getSubmissions(
            @RequestParam(value = "homestayId", required = false) Long homestayId,
            @RequestParam(value = "status", required = false, defaultValue = "all") String status,
            @RequestParam(value = "taskType", required = false, defaultValue = "all") String taskType,
            @RequestParam(value = "search", required = false) String search) {
        return ResponseEntity.ok(ownerMissionService.getSubmissions(homestayId, status, taskType, search));
    }

    /**
     * Duyệt bài nộp
     */
    @PostMapping("/submissions/{idOrCode}/approve")
    public ResponseEntity<OwnerSubmissionDTO> approveSubmission(
            @PathVariable String idOrCode,
            @RequestBody(required = false) ApproveSubmissionRequest req) {
        return ResponseEntity.ok(ownerMissionService.approveSubmission(idOrCode, req));
    }

    /**
     * Từ chối bài nộp
     */
    @PostMapping("/submissions/{idOrCode}/reject")
    public ResponseEntity<OwnerSubmissionDTO> rejectSubmission(
            @PathVariable String idOrCode,
            @RequestBody RejectSubmissionRequest req) {
        return ResponseEntity.ok(ownerMissionService.rejectSubmission(idOrCode, req));
    }

    /**
     * Yêu cầu chụp lại bài nộp
     */
    @PostMapping("/submissions/{idOrCode}/retake")
    public ResponseEntity<OwnerSubmissionDTO> retakeSubmission(
            @PathVariable String idOrCode,
            @RequestBody RetakeSubmissionRequest req) {
        return ResponseEntity.ok(ownerMissionService.retakeSubmission(idOrCode, req));
    }

    /**
     * Lấy thống kê KPI nhiệm vụ
     */
    @GetMapping("/stats")
    public ResponseEntity<OwnerMissionStatsDTO> getStats(
            @RequestParam(value = "homestayId", required = false) Long homestayId) {
        return ResponseEntity.ok(ownerMissionService.getStats(homestayId));
    }

    /**
     * Lấy kho quà tặng / voucher
     */
    @GetMapping("/reward-stocks")
    public ResponseEntity<List<RewardStockDTO>> getRewardStocks(
            @RequestParam(value = "homestayId", required = false) Long homestayId) {
        return ResponseEntity.ok(ownerMissionService.getRewardStocks(homestayId));
    }

    /**
     * Lưu kho quà tặng / voucher
     */
    @PostMapping("/reward-stocks")
    public ResponseEntity<List<RewardStockDTO>> saveRewardStocks(@RequestBody SaveStockRequest req) {
        return ResponseEntity.ok(ownerMissionService.saveRewardStocks(req));
    }

    /**
     * Gửi quà tri ân tháng cho khách tiêu biểu
     */
    @PostMapping("/send-gift")
    public ResponseEntity<Map<String, Object>> sendGift(@RequestBody SendGiftRequest req) {
        return ResponseEntity.ok(ownerMissionService.sendAppreciationGift(req));
    }
}
