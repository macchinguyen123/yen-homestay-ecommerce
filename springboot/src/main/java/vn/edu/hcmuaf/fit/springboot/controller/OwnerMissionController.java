package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerMissionDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerMissionRequests.*;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerMissionStatsDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerMissionStatsDTO.RewardStockDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerSubmissionDTO;
import vn.edu.hcmuaf.fit.springboot.service.OwnerMissionService;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.GuestTaskRepository;
import vn.edu.hcmuaf.fit.springboot.repository.GuestTaskSubmissionRepository;
import vn.edu.hcmuaf.fit.springboot.repository.RewardStockRepository;
import vn.edu.hcmuaf.fit.springboot.model.GuestTask;
import vn.edu.hcmuaf.fit.springboot.model.GuestTaskSubmission;
import vn.edu.hcmuaf.fit.springboot.model.RewardStock;

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
    private final HomestayRepository homestayRepository;
    private final GuestTaskRepository guestTaskRepository;
    private final GuestTaskSubmissionRepository submissionRepository;
    private final RewardStockRepository rewardStockRepository;

    private Long ownerId(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) throw new NumberFormatException();
            return Long.valueOf(authentication.getName());
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập lại.");
        }
    }

    private void requireOwnedHomestay(Authentication authentication, Long homestayId) {
        Long ownerId = ownerId(authentication);
        if (homestayId == null || homestayRepository.findById(homestayId).filter(h -> ownerId.equals(h.getOwnerId())).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền quản lý cơ sở này.");
        }
    }

    private void requireOwnedTask(Authentication authentication, Long id) {
        GuestTask task = guestTaskRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhiệm vụ."));
        requireOwnedHomestay(authentication, task.getHomestayId());
    }

    private void requireOwnedSubmission(Authentication authentication, String idOrCode) {
        GuestTaskSubmission submission;
        if (idOrCode.matches("^\\d+$")) submission = submissionRepository.findById(Long.parseLong(idOrCode)).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bài nộp."));
        else submission = submissionRepository.findBySubmissionCode(idOrCode).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bài nộp."));
        requireOwnedHomestay(authentication, submission.getHomestayId());
    }

    private void requireOwnedStock(Authentication authentication, Long stockId) {
        RewardStock stock = rewardStockRepository.findById(stockId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy phần thưởng."));
        requireOwnedHomestay(authentication, stock.getHomestayId());
    }

    /**
     * Lấy danh sách nhiệm vụ đang có
     */
    @GetMapping
    public ResponseEntity<List<OwnerMissionDTO>> getMissions(
            @RequestParam(value = "homestayId", required = false) Long homestayId,
            Authentication authentication) {
        requireOwnedHomestay(authentication, homestayId);
        return ResponseEntity.ok(ownerMissionService.getMissions(homestayId));
    }

    /**
     * Tạo nhiệm vụ mới
     */
    @PostMapping
    public ResponseEntity<OwnerMissionDTO> createMission(@RequestBody CreateMissionRequest req, Authentication authentication) {
        requireOwnedHomestay(authentication, req.getHomestayId());
        return ResponseEntity.ok(ownerMissionService.createMission(req));
    }

    /**
     * Cập nhật nhiệm vụ
     */
    @PutMapping("/{id}")
    public ResponseEntity<OwnerMissionDTO> updateMission(
            @PathVariable Long id,
            @RequestBody CreateMissionRequest req,
            Authentication authentication) {
        requireOwnedTask(authentication, id);
        if (req.getHomestayId() != null) requireOwnedHomestay(authentication, req.getHomestayId());
        return ResponseEntity.ok(ownerMissionService.updateMission(id, req));
    }

    /**
     * Bật / tắt (Pause / Active) trạng thái nhiệm vụ
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<OwnerMissionDTO> toggleMissionStatus(@PathVariable Long id, Authentication authentication) {
        requireOwnedTask(authentication, id);
        return ResponseEntity.ok(ownerMissionService.toggleMissionStatus(id));
    }

    /**
     * Xóa nhiệm vụ
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMission(@PathVariable Long id, Authentication authentication) {
        requireOwnedTask(authentication, id);
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
            @RequestParam(value = "search", required = false) String search,
            Authentication authentication) {
        requireOwnedHomestay(authentication, homestayId);
        return ResponseEntity.ok(ownerMissionService.getSubmissions(homestayId, status, taskType, search));
    }

    /**
     * Duyệt bài nộp
     */
    @PostMapping("/submissions/{idOrCode}/approve")
    public ResponseEntity<OwnerSubmissionDTO> approveSubmission(
            @PathVariable String idOrCode,
            @RequestBody(required = false) ApproveSubmissionRequest req,
            Authentication authentication) {
        requireOwnedSubmission(authentication, idOrCode);
        return ResponseEntity.ok(ownerMissionService.approveSubmission(idOrCode, req));
    }

    /**
     * Từ chối bài nộp
     */
    @PostMapping("/submissions/{idOrCode}/reject")
    public ResponseEntity<OwnerSubmissionDTO> rejectSubmission(
            @PathVariable String idOrCode,
            @RequestBody RejectSubmissionRequest req,
            Authentication authentication) {
        requireOwnedSubmission(authentication, idOrCode);
        return ResponseEntity.ok(ownerMissionService.rejectSubmission(idOrCode, req));
    }

    /**
     * Yêu cầu chụp lại bài nộp
     */
    @PostMapping("/submissions/{idOrCode}/retake")
    public ResponseEntity<OwnerSubmissionDTO> retakeSubmission(
            @PathVariable String idOrCode,
            @RequestBody RetakeSubmissionRequest req,
            Authentication authentication) {
        requireOwnedSubmission(authentication, idOrCode);
        return ResponseEntity.ok(ownerMissionService.retakeSubmission(idOrCode, req));
    }

    /**
     * Lấy thống kê KPI nhiệm vụ
     */
    @GetMapping("/stats")
    public ResponseEntity<OwnerMissionStatsDTO> getStats(
            @RequestParam(value = "homestayId", required = false) Long homestayId,
            Authentication authentication) {
        requireOwnedHomestay(authentication, homestayId);
        return ResponseEntity.ok(ownerMissionService.getStats(homestayId));
    }

    /**
     * Lấy kho quà tặng / voucher
     */
    @GetMapping("/reward-stocks")
    public ResponseEntity<List<RewardStockDTO>> getRewardStocks(
            @RequestParam(value = "homestayId", required = false) Long homestayId,
            Authentication authentication) {
        requireOwnedHomestay(authentication, homestayId);
        return ResponseEntity.ok(ownerMissionService.getRewardStocks(homestayId));
    }

    /**
     * Lưu kho quà tặng / voucher
     */
    @PostMapping("/reward-stocks")
    public ResponseEntity<List<RewardStockDTO>> saveRewardStocks(@RequestBody SaveStockRequest req, Authentication authentication) {
        requireOwnedHomestay(authentication, req.getHomestayId());
        if (req.getItems() != null) req.getItems().stream().map(SaveStockRequest.StockItem::getId).filter(id -> id != null && id > 0).forEach(id -> requireOwnedStock(authentication, id));
        return ResponseEntity.ok(ownerMissionService.saveRewardStocks(req));
    }

    /**
     * Gửi quà tri ân tháng cho khách tiêu biểu
     */
    @PostMapping("/send-gift")
    public ResponseEntity<Map<String, Object>> sendGift(@RequestBody SendGiftRequest req, Authentication authentication) {
        requireOwnedHomestay(authentication, req.getHomestayId());
        return ResponseEntity.ok(ownerMissionService.sendAppreciationGift(req));
    }
}
