package vn.edu.hcmuaf.fit.springboot.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerMissionDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerMissionRequests.*;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerMissionStatsDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerMissionStatsDTO.RewardStockDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerMissionStatsDTO.TopGuestDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerSubmissionDTO;
import vn.edu.hcmuaf.fit.springboot.model.GuestTask;
import vn.edu.hcmuaf.fit.springboot.model.GuestTaskSubmission;
import vn.edu.hcmuaf.fit.springboot.model.RewardStock;
import vn.edu.hcmuaf.fit.springboot.repository.GuestTaskRepository;
import vn.edu.hcmuaf.fit.springboot.repository.GuestTaskSubmissionRepository;
import vn.edu.hcmuaf.fit.springboot.repository.RewardStockRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OwnerMissionService {

    private final JdbcTemplate jdbcTemplate;
    private final GuestTaskRepository guestTaskRepository;
    private final GuestTaskSubmissionRepository submissionRepository;
    private final RewardStockRepository rewardStockRepository;
    private final NotificationService notificationService;

    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("HH:mm • dd/MM/yyyy");

    @PostConstruct
    public void initDatabase() {
        try {
            log.info("Khởi tạo cấu trúc bảng quản lý nhiệm vụ khách (Missions/Tasks) cho Chủ nhà...");

            // 1. Bổ sung các cột mở rộng cho guest_tasks
            jdbcTemplate.execute("ALTER TABLE guest_tasks ADD COLUMN IF NOT EXISTS icon VARCHAR(100)");
            jdbcTemplate.execute("ALTER TABLE guest_tasks ADD COLUMN IF NOT EXISTS reward_type VARCHAR(100)");
            jdbcTemplate.execute("ALTER TABLE guest_tasks ADD COLUMN IF NOT EXISTS reward_value VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE guest_tasks ADD COLUMN IF NOT EXISTS reward_extra VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE guest_tasks ADD COLUMN IF NOT EXISTS from_date VARCHAR(50)");
            jdbcTemplate.execute("ALTER TABLE guest_tasks ADD COLUMN IF NOT EXISTS to_date VARCHAR(50)");
            jdbcTemplate.execute("ALTER TABLE guest_tasks ADD COLUMN IF NOT EXISTS need_photo BOOLEAN DEFAULT true");
            jdbcTemplate.execute("ALTER TABLE guest_tasks ADD COLUMN IF NOT EXISTS auto_approve BOOLEAN DEFAULT false");
            jdbcTemplate.execute("ALTER TABLE guest_tasks ADD COLUMN IF NOT EXISTS given_count INT DEFAULT 0");

            // 2. Tạo bảng guest_task_submissions nếu chưa có
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS guest_task_submissions (" +
                    "submission_id BIGSERIAL PRIMARY KEY, " +
                    "submission_code VARCHAR(50), " +
                    "homestay_id BIGINT NOT NULL, " +
                    "tourist_id BIGINT, " +
                    "guest_name VARCHAR(255), " +
                    "room_name VARCHAR(255), " +
                    "task_id BIGINT, " +
                    "task_title VARCHAR(255), " +
                    "task_type VARCHAR(50), " +
                    "review_text TEXT, " +
                    "reward_text VARCHAR(255), " +
                    "photos_count INT DEFAULT 1, " +
                    "guest_avatar TEXT, " +
                    "submission_image TEXT, " +
                    "status VARCHAR(50) DEFAULT 'pending', " +
                    "reject_reason VARCHAR(255), " +
                    "retake_reason VARCHAR(255), " +
                    "retake_deadline VARCHAR(100), " +
                    "owner_note TEXT, " +
                    "submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "reviewed_at TIMESTAMP" +
                    ")");

            // 3. Tạo bảng reward_stocks nếu chưa có
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS reward_stocks (" +
                    "stock_id BIGSERIAL PRIMARY KEY, " +
                    "homestay_id BIGINT NOT NULL, " +
                    "name VARCHAR(255) NOT NULL, " +
                    "type VARCHAR(100) NOT NULL, " +
                    "qty INT DEFAULT 0, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ")");

            // Không tự chèn dữ liệu mẫu khi khởi động.

            log.info("Khởi tạo cấu trúc bảng Missions & Submissions thành công!");
        } catch (Exception e) {
            log.error("Lỗi khi khởi tạo database OwnerMissionService: {}", e.getMessage(), e);
        }
    }

    private Long resolveHomestayId(Long homestayId) {
        if (homestayId != null && homestayId > 0) {
            return homestayId;
        }
        return null;
    }

    // ==========================================
    // MISSIONS CRUD
    // ==========================================

    @Transactional(readOnly = true)
    public List<OwnerMissionDTO> getMissions(Long homestayId) {
        if (homestayId == null || homestayId <= 0) return List.of();
        List<GuestTask> list = guestTaskRepository.findByHomestayId(homestayId);
        return list.stream().map(this::mapToMissionDTO).collect(Collectors.toList());
    }

    @Transactional
    public OwnerMissionDTO createMission(CreateMissionRequest req) {
        Long hid = resolveHomestayId(req.getHomestayId());
        if (hid == null) throw new IllegalArgumentException("Vui lòng chọn cơ sở trước khi tạo nhiệm vụ.");
        GuestTask task = GuestTask.builder()
                .homestayId(hid)
                .title(req.getTitle())
                .description(req.getDesc())
                .icon(req.getIcon() != null && !req.getIcon().isBlank() ? req.getIcon() : "award_star")
                .rewardType(req.getRewardType())
                .rewardValue(req.getRewardValue())
                .rewardExtra(req.getRewardExtra())
                .fromDate(req.getFrom())
                .toDate(req.getTo())
                .needPhoto(req.getNeedPhoto() != null ? req.getNeedPhoto() : true)
                .autoApprove(req.getAutoApprove() != null ? req.getAutoApprove() : false)
                .givenCount(0)
                .status(req.getStatus() != null ? req.getStatus().toUpperCase() : "ACTIVE")
                .build();
        GuestTask saved = guestTaskRepository.save(task);
        return mapToMissionDTO(saved);
    }

    @Transactional
    public OwnerMissionDTO updateMission(Long id, CreateMissionRequest req) {
        GuestTask task = guestTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhiệm vụ với ID: " + id));

        if (req.getTitle() != null) task.setTitle(req.getTitle());
        if (req.getDesc() != null) task.setDescription(req.getDesc());
        if (req.getIcon() != null) task.setIcon(req.getIcon());
        if (req.getRewardType() != null) task.setRewardType(req.getRewardType());
        if (req.getRewardValue() != null) task.setRewardValue(req.getRewardValue());
        if (req.getRewardExtra() != null) task.setRewardExtra(req.getRewardExtra());
        if (req.getFrom() != null) task.setFromDate(req.getFrom());
        if (req.getTo() != null) task.setToDate(req.getTo());
        if (req.getNeedPhoto() != null) task.setNeedPhoto(req.getNeedPhoto());
        if (req.getAutoApprove() != null) task.setAutoApprove(req.getAutoApprove());
        if (req.getStatus() != null) task.setStatus(req.getStatus().toUpperCase());

        GuestTask updated = guestTaskRepository.save(task);
        return mapToMissionDTO(updated);
    }

    @Transactional
    public void deleteMission(Long id) {
        guestTaskRepository.deleteById(id);
    }

    @Transactional
    public OwnerMissionDTO toggleMissionStatus(Long id) {
        GuestTask task = guestTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy nhiệm vụ với ID: " + id));
        String newStatus = "ACTIVE".equalsIgnoreCase(task.getStatus()) ? "INACTIVE" : "ACTIVE";
        task.setStatus(newStatus);
        GuestTask updated = guestTaskRepository.save(task);
        return mapToMissionDTO(updated);
    }

    private OwnerMissionDTO mapToMissionDTO(GuestTask t) {
        return OwnerMissionDTO.builder()
                .id("M" + String.format("%03d", t.getId()))
                .rawId(t.getId())
                .homestayId(t.getHomestayId())
                .title(t.getTitle())
                .desc(t.getDescription())
                .icon(t.getIcon() != null && !t.getIcon().isBlank() ? t.getIcon() : "award_star")
                .rewardType(t.getRewardType())
                .rewardValue(t.getRewardValue())
                .rewardExtra(t.getRewardExtra())
                .reward("voucher-percent".equalsIgnoreCase(t.getRewardType()) ? "Voucher " + t.getRewardValue() + "%" :
                        "voucher-amount".equalsIgnoreCase(t.getRewardType()) ? "Voucher " + t.getRewardValue() + "₫" :
                                (t.getRewardValue() != null ? t.getRewardValue() : t.getRewardExtra()))
                .from(t.getFromDate())
                .to(t.getToDate())
                .needPhoto(t.getNeedPhoto())
                .autoApprove(t.getAutoApprove())
                .given(t.getGivenCount() != null ? t.getGivenCount() : 0)
                .status(t.getStatus() != null ? t.getStatus().toLowerCase() : "active")
                .build();
    }

    // ==========================================
    // SUBMISSIONS WORKFLOW
    // ==========================================

    @Transactional(readOnly = true)
    public List<OwnerSubmissionDTO> getSubmissions(Long homestayId, String status, String taskType, String search) {
        if (homestayId == null || homestayId <= 0) return List.of();
        List<GuestTaskSubmission> list = submissionRepository.findByHomestayIdOrderBySubmittedAtDesc(homestayId);

        return list.stream()
                .filter(s -> {
                    if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
                        return status.equalsIgnoreCase(s.getStatus());
                    }
                    return true;
                })
                .filter(s -> {
                    if (taskType != null && !taskType.isBlank() && !"all".equalsIgnoreCase(taskType)) {
                        return taskType.equalsIgnoreCase(s.getTaskType());
                    }
                    return true;
                })
                .filter(s -> {
                    if (search != null && !search.isBlank()) {
                        String q = search.toLowerCase();
                        boolean matchGuest = s.getGuestName() != null && s.getGuestName().toLowerCase().contains(q);
                        boolean matchTask = s.getTaskTitle() != null && s.getTaskTitle().toLowerCase().contains(q);
                        boolean matchCode = s.getSubmissionCode() != null && s.getSubmissionCode().toLowerCase().contains(q);
                        return matchGuest || matchTask || matchCode;
                    }
                    return true;
                })
                .map(this::mapToSubmissionDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public OwnerSubmissionDTO approveSubmission(String idOrCode, ApproveSubmissionRequest req) {
        GuestTaskSubmission sub = findSubmission(idOrCode);
        sub.setStatus("approved");
        sub.setReviewedAt(LocalDateTime.now());
        if (req != null && req.getReward() != null && !req.getReward().isBlank()) {
            sub.setRewardText(req.getReward());
        }
        if (req != null && req.getNote() != null) {
            sub.setOwnerNote(req.getNote());
        }

        // Tăng số lượng đã trao cho nhiệm vụ tương ứng nếu có
        if (sub.getTaskId() != null) {
            guestTaskRepository.findById(sub.getTaskId()).ifPresent(task -> {
                int count = task.getGivenCount() != null ? task.getGivenCount() : 0;
                task.setGivenCount(count + 1);
                guestTaskRepository.save(task);
            });
        }

        GuestTaskSubmission updated = submissionRepository.save(sub);
        return mapToSubmissionDTO(updated);
    }

    @Transactional
    public OwnerSubmissionDTO rejectSubmission(String idOrCode, RejectSubmissionRequest req) {
        GuestTaskSubmission sub = findSubmission(idOrCode);
        sub.setStatus("rejected");
        sub.setReviewedAt(LocalDateTime.now());
        if (req != null) {
            sub.setRejectReason(req.getReason());
            sub.setOwnerNote(req.getNote());
        }
        GuestTaskSubmission updated = submissionRepository.save(sub);
        return mapToSubmissionDTO(updated);
    }

    @Transactional
    public OwnerSubmissionDTO retakeSubmission(String idOrCode, RetakeSubmissionRequest req) {
        GuestTaskSubmission sub = findSubmission(idOrCode);
        sub.setStatus("retake");
        sub.setReviewedAt(LocalDateTime.now());
        if (req != null) {
            sub.setRetakeReason(req.getReason());
            sub.setOwnerNote(req.getNote());
            sub.setRetakeDeadline(req.getDeadline());
        }
        GuestTaskSubmission updated = submissionRepository.save(sub);
        return mapToSubmissionDTO(updated);
    }

    private GuestTaskSubmission findSubmission(String idOrCode) {
        if (idOrCode.matches("^\\d+$")) {
            Long rawId = Long.parseLong(idOrCode);
            Optional<GuestTaskSubmission> opt = submissionRepository.findById(rawId);
            if (opt.isPresent()) return opt.get();
        }
        return submissionRepository.findBySubmissionCode(idOrCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài nộp với mã: " + idOrCode));
    }

    private OwnerSubmissionDTO mapToSubmissionDTO(GuestTaskSubmission s) {
        String formattedTime = s.getSubmittedAt() != null ? s.getSubmittedAt().format(DATETIME_FMT) : "Chưa cập nhật";
        String code = s.getSubmissionCode() != null && !s.getSubmissionCode().isBlank() ?
                s.getSubmissionCode() : ("S" + String.format("%03d", s.getId()));

        return OwnerSubmissionDTO.builder()
                .id(code)
                .rawId(s.getId())
                .homestayId(s.getHomestayId())
                .guest(s.getGuestName() != null ? s.getGuestName() : "Khách lưu trú")
                .room(s.getRoomName() != null ? s.getRoomName() : "Chưa chỉ định")
                .time(formattedTime)
                .taskType(s.getTaskType() != null ? s.getTaskType() : "general")
                .task(s.getTaskTitle() != null ? s.getTaskTitle() : "Nhiệm vụ homestay")
                .review(s.getReviewText() != null ? s.getReviewText() : "")
                .reward(s.getRewardText())
                .photos(s.getPhotosCount() != null ? s.getPhotosCount() : 0)
                .avatar(s.getGuestAvatar())
                .image(s.getSubmissionImage())
                .status(s.getStatus() != null ? s.getStatus().toLowerCase() : "pending")
                .rejectReason(s.getRejectReason())
                .retakeReason(s.getRetakeReason())
                .retakeDeadline(s.getRetakeDeadline())
                .ownerNote(s.getOwnerNote())
                .build();
    }

    // ==========================================
    // REWARD STOCK & GIFTS
    // ==========================================

    @Transactional(readOnly = true)
    public List<RewardStockDTO> getRewardStocks(Long homestayId) {
        Long hid = resolveHomestayId(homestayId);
        if (hid == null) return List.of();
        List<RewardStock> stocks = rewardStockRepository.findByHomestayIdOrderByIdAsc(hid);
        return stocks.stream()
                .map(st -> RewardStockDTO.builder()
                        .id(st.getId())
                        .name(st.getName())
                        .type(st.getType())
                        .qty(st.getQty() != null ? st.getQty() : 0)
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public List<RewardStockDTO> saveRewardStocks(SaveStockRequest req) {
        Long hid = resolveHomestayId(req.getHomestayId());
        if (hid == null) throw new IllegalArgumentException("Vui lòng chọn cơ sở trước khi lưu kho phần thưởng.");
        if (req.getItems() != null) {
            Set<Long> retainedIds = req.getItems().stream().map(SaveStockRequest.StockItem::getId).filter(Objects::nonNull).collect(Collectors.toSet());
            rewardStockRepository.findByHomestayIdOrderByIdAsc(hid).stream()
                    .filter(stock -> !retainedIds.contains(stock.getId()))
                    .forEach(rewardStockRepository::delete);
            for (SaveStockRequest.StockItem item : req.getItems()) {
                if (item.getId() != null && item.getId() > 0) {
                    rewardStockRepository.findById(item.getId()).ifPresent(stock -> {
                        if (!hid.equals(stock.getHomestayId())) throw new IllegalArgumentException("Phần thưởng không thuộc cơ sở đang chọn.");
                        if (item.getName() != null) stock.setName(item.getName());
                        if (item.getType() != null) stock.setType(item.getType());
                        if (item.getQty() != null) stock.setQty(item.getQty());
                        rewardStockRepository.save(stock);
                    });
                } else if (item.getName() != null && !item.getName().isBlank()) {
                    RewardStock newStock = RewardStock.builder()
                            .homestayId(hid)
                            .name(item.getName())
                            .type(item.getType() != null ? item.getType() : "Quà tặng")
                            .qty(item.getQty() != null ? item.getQty() : 0)
                            .build();
                    rewardStockRepository.save(newStock);
                }
            }
        }
        return getRewardStocks(hid);
    }

    @Transactional
    public Map<String, Object> sendAppreciationGift(SendGiftRequest req) {
        Long hid = resolveHomestayId(req.getHomestayId());
        if (hid == null) throw new IllegalArgumentException("Vui lòng chọn cơ sở trước khi gửi quà.");
        List<Long> recipients = new ArrayList<>();
        if (req.getSelectedGuests() != null && !req.getSelectedGuests().isEmpty()) {
            for (String value : req.getSelectedGuests()) {
                try { recipients.add(Long.valueOf(value)); } catch (NumberFormatException ignored) { }
            }
        }
        int sentCount = 0;
        String message = (req.getMessage() == null ? "Cảm ơn bạn đã tham gia hoạt động tại homestay." : req.getMessage().trim())
                + (req.getGiftItem() == null || req.getGiftItem().isBlank() ? "" : " Phần quà: " + req.getGiftItem().trim() + ".");
        for (Long recipientId : new LinkedHashSet<>(recipients)) {
            Boolean isParticipant = jdbcTemplate.queryForObject("SELECT EXISTS(SELECT 1 FROM guest_task_submissions WHERE homestay_id = ? AND tourist_id = ? AND LOWER(status) = 'approved')", Boolean.class, hid, recipientId);
            if (Boolean.TRUE.equals(isParticipant)) {
                notificationService.create(recipientId, "Bạn nhận được quà tri ân", message, "REWARD", hid, "/notifications");
                sentCount++;
            }
        }

        Map<String, Object> res = new HashMap<>();
        res.put("success", sentCount > 0);
        res.put("message", sentCount > 0 ? "Đã lưu và gửi thông báo quà tri ân tới " + sentCount + " du khách." : "Không có du khách đủ điều kiện để nhận quà.");
        res.put("sentCount", sentCount);
        res.put("giftItem", req.getGiftItem());
        return res;
    }

    // ==========================================
    // STATS & KPI
    // ==========================================

    @Transactional(readOnly = true)
    public OwnerMissionStatsDTO getStats(Long homestayId) {
        Long hid = resolveHomestayId(homestayId);
        if (hid == null) return OwnerMissionStatsDTO.builder().activeMissions(0).pendingToday(0).participantGuests(0).rewardedVouchers(0).interactionRate(0).topGuests(List.of()).rewardStocks(List.of()).build();

        long activeMissions;
        long pendingToday;
        long rewardedVouchers;

        if (homestayId != null && homestayId > 0) {
            activeMissions = guestTaskRepository.findByHomestayId(homestayId).stream()
                    .filter(t -> "active".equalsIgnoreCase(t.getStatus()))
                    .count();
            Long pendingCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM guest_task_submissions WHERE homestay_id = ? AND LOWER(status) = 'pending' AND CAST(submitted_at AS DATE) = CURRENT_DATE", Long.class, homestayId);
            pendingToday = pendingCount == null ? 0 : pendingCount;
            rewardedVouchers = guestTaskRepository.findByHomestayId(homestayId).stream()
                    .mapToLong(t -> t.getGivenCount() != null ? t.getGivenCount() : 0)
                    .sum();
        } else {
            activeMissions = guestTaskRepository.findAll().stream()
                    .filter(t -> "active".equalsIgnoreCase(t.getStatus()))
                    .count();
            pendingToday = submissionRepository.findAll().stream()
                    .filter(s -> "pending".equalsIgnoreCase(s.getStatus()))
                    .count();
            rewardedVouchers = guestTaskRepository.findAll().stream()
                    .mapToLong(t -> t.getGivenCount() != null ? t.getGivenCount() : 0)
                    .sum();
        }

        Long participantCount = jdbcTemplate.queryForObject("SELECT COUNT(DISTINCT tourist_id) FROM guest_task_submissions WHERE homestay_id = ? AND tourist_id IS NOT NULL", Long.class, hid);
        long participantGuests = participantCount == null ? 0 : participantCount;
        Long bookingGuestCount = jdbcTemplate.queryForObject("SELECT COUNT(DISTINCT tourist_id) FROM bookings WHERE homestay_id = ? AND tourist_id IS NOT NULL", Long.class, hid);
        int interactionRate = bookingGuestCount == null || bookingGuestCount == 0 ? 0 : (int) Math.min(100, Math.round(participantGuests * 100.0 / bookingGuestCount));

        // Bảng xếp hạng Top khách tích cực
        List<TopGuestDTO> topGuests = jdbcTemplate.query("""
                SELECT tourist_id, MAX(guest_name) AS guest_name, MAX(guest_avatar) AS guest_avatar, COUNT(*) AS completed
                FROM guest_task_submissions
                WHERE homestay_id = ? AND tourist_id IS NOT NULL AND LOWER(status) = 'approved'
                GROUP BY tourist_id ORDER BY completed DESC LIMIT 10
                """, (rs, rowNum) -> TopGuestDTO.builder()
                .id(rs.getLong("tourist_id"))
                .name(rs.getString("guest_name") == null ? "Du khách" : rs.getString("guest_name"))
                .completed(rs.getInt("completed"))
                .points(null)
                .avatar(rs.getString("guest_avatar"))
                .build(), hid);

        return OwnerMissionStatsDTO.builder()
                .activeMissions(activeMissions)
                .pendingToday(pendingToday)
                .participantGuests(participantGuests)
                .rewardedVouchers(rewardedVouchers)
                .interactionRate(interactionRate)
                .topGuests(topGuests)
                .rewardStocks(getRewardStocks(hid))
                .build();
    }
}
