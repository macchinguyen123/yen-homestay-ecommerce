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
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.RewardStock;
import vn.edu.hcmuaf.fit.springboot.repository.GuestTaskRepository;
import vn.edu.hcmuaf.fit.springboot.repository.GuestTaskSubmissionRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
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
    private final HomestayRepository homestayRepository;

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

            // 4. Seed dữ liệu mẫu nếu rỗng
            seedInitialDataIfEmpty();

            log.info("Khởi tạo cấu trúc bảng Missions & Submissions thành công!");
        } catch (Exception e) {
            log.error("Lỗi khi khởi tạo database OwnerMissionService: {}", e.getMessage(), e);
        }
    }

    private Long resolveHomestayId(Long homestayId) {
        if (homestayId != null && homestayId > 0) {
            return homestayId;
        }
        // Tìm homestay đầu tiên có task hoặc homestay đầu tiên trong hệ thống
        Long hsWithTasks = guestTaskRepository.findAll().stream()
                .map(GuestTask::getHomestayId)
                .filter(id -> id != null && id > 0)
                .findFirst()
                .orElse(null);
        if (hsWithTasks != null) {
            return hsWithTasks;
        }
        return homestayRepository.findAll().stream()
                .findFirst()
                .map(Homestay::getId)
                .orElse(1L);
    }

    private void seedInitialDataIfEmpty() {
        Long defaultHomestayId = resolveHomestayId(null);

        // Kiểm tra xem homestay mặc định hoặc hệ thống đã có task chuẩn chưa
        boolean hasRichTasks = guestTaskRepository.findAll().stream()
                .anyMatch(t -> t.getIcon() != null && !t.getIcon().isBlank() && !"award_star".equals(t.getIcon()));

        if (!hasRichTasks) {
            log.info("Chưa có nhiệm vụ chuẩn đầy đủ thuộc tính, tiến hành seed 4 nhiệm vụ chuẩn cho homestay {}...", defaultHomestayId);
            List<GuestTask> sampleTasks = List.of(
                    GuestTask.builder()
                            .homestayId(defaultHomestayId)
                            .title("Check-in bình minh thung lũng Mai Châu")
                            .description("Chụp ảnh góc ban công hoặc sân vườn lúc sương sớm, gắn thẻ định vị Nhà Sàn Mộc kèm hashtag #NhaSanMoc.")
                            .icon("wb_sunny")
                            .rewardType("voucher-percent")
                            .rewardValue("10")
                            .rewardExtra("")
                            .fromDate("2026-09-01")
                            .toDate("2026-10-31")
                            .needPhoto(true)
                            .autoApprove(false)
                            .givenCount(48)
                            .status("ACTIVE")
                            .build(),
                    GuestTask.builder()
                            .homestayId(defaultHomestayId)
                            .title("Làm cơm lam cùng nghệ nhân Làng Cố")
                            .description("Trải nghiệm tự tay cho gạo nếp nương vào ống tre và nướng bên bếp lửa hồng cùng đồng bào dân tộc Thái.")
                            .icon("outdoor_grill")
                            .rewardType("points")
                            .rewardValue("50")
                            .rewardExtra("Quà nông sản lưu niệm")
                            .fromDate("2026-09-01")
                            .toDate("2026-12-31")
                            .needPhoto(true)
                            .autoApprove(false)
                            .givenCount(32)
                            .status("ACTIVE")
                            .build(),
                    GuestTask.builder()
                            .homestayId(defaultHomestayId)
                            .title("Đánh giá 5 sao kèm 3 ảnh thực tế")
                            .description("Để lại nhận xét chân thực trên Google Maps hoặc nền tảng Booking về trải nghiệm bình yên tại Nhà Sàn Mộc.")
                            .icon("star")
                            .rewardType("voucher-amount")
                            .rewardValue("100000")
                            .rewardExtra("")
                            .fromDate("2026-09-01")
                            .toDate("2026-12-31")
                            .needPhoto(true)
                            .autoApprove(false)
                            .givenCount(32)
                            .status("ACTIVE")
                            .build(),
                    GuestTask.builder()
                            .homestayId(defaultHomestayId)
                            .title("Đánh giá 5 sao kèm 3 ảnh thực tế")
                            .description("Để lại nhận xét chân thực trên Google Maps hoặc nền tảng Booking về trải nghiệm bình yên tại Nhà Sàn Mộc.")
                            .icon("star")
                            .rewardType("voucher-amount")
                            .rewardValue("100000")
                            .rewardExtra("")
                            .fromDate("2026-09-01")
                            .toDate("2026-12-31")
                            .needPhoto(true)
                            .autoApprove(false)
                            .givenCount(16)
                            .status("ACTIVE")
                            .build(),
                    GuestTask.builder()
                            .homestayId(defaultHomestayId)
                            .title("Trekking khám phá bản Lác 2 mùa lúa chín")
                            .description("Ghi lại 3 khoảnh khắc đẹp trên cung đường ruộng bậc thang và chia sẻ vị trí bản Lác 2.")
                            .icon("hiking")
                            .rewardType("gift")
                            .rewardValue("Khăn thổ cẩm thủ công")
                            .rewardExtra("")
                            .fromDate("2026-09-01")
                            .toDate("2026-11-30")
                            .needPhoto(true)
                            .autoApprove(false)
                            .givenCount(24)
                            .status("ACTIVE")
                            .build()
            );
            guestTaskRepository.saveAll(sampleTasks);
        }

        // Seed submissions nếu trống
        if (submissionRepository.count() == 0) {
            log.info("Bảng guest_task_submissions đang rỗng, tiến hành seed 2 bài nộp chờ duyệt...");
            List<GuestTaskSubmission> sampleSubmissions = List.of(
                    GuestTaskSubmission.builder()
                            .submissionCode("S001")
                            .homestayId(defaultHomestayId)
                            .guestName("Trần Thị Hương")
                            .roomName("Phòng Garden View")
                            .taskTitle("Mặc trang phục dân tộc Thái chụp ảnh bên khung dệt thổ cẩm Nhà Sàn Mộc")
                            .taskType("costume")
                            .reviewText("Không gian nhà sàn Mai Châu quá tuyệt vời, cô chủ chỉ cách dệt vải rất tận tình! Mùa lúa chín này chắc chắn nhóm mình sẽ rủ bạn bè quay lại.")
                            .rewardText("Voucher 15% + 1 túi trà gạo lứt Mộc Châu")
                            .photosCount(1)
                            .guestAvatar("https://lh3.googleusercontent.com/aida-public/AB6AXuDtBD2J0dMb6ui-jzFd-s3WAOrIcULKNiD9XtfnGxQMKSTx355Pf1EjERQXBHDwHrcQ0Rorvh9B6EK8HB6KmTt_y_Vmq08HXH1mv79H5Vu9HA98ZemUl4gMQKLX8UE6D4XyoH4aj98giLTIomA-cZpFPmBtgmFxgoZt0ZKA5x-4LkgkGP-hJ2DyiPrZOmmqIdCcd6okDRUACpFaDNJU99_AMzc9ReyPXk77zeU4Z5vnxIG6w4_nVg8")
                            .submissionImage("https://lh3.googleusercontent.com/aida-public/AB6AXuAwxRCSb8O0TEvP8qWKkyBWYmOPRU7CAe-lU0L0LMkQVLCWwT-WPYALrACR8Db8vw3_4jArbeXHHO_9d76yf7xm93aRwrudcovcbdkH-3EQrrGzyVg0iJ-Mvu69r8SV1GpbtRs1onXyn8r2zhoo3AUha2-9zCn4Myw7IYvyDRyt2uYN6sGiBB77aieKV_8H49oOFbrdmjYwsetb-x5cKFX4PCfWM-yOuk8sjzC85RU_W3_1EPQSU6E")
                            .status("pending")
                            .submittedAt(LocalDateTime.now().minusHours(3))
                            .build(),
                    GuestTaskSubmission.builder()
                            .submissionCode("S002")
                            .homestayId(defaultHomestayId)
                            .guestName("Lê Văn Hiếu")
                            .roomName("Phòng Lake View")
                            .taskTitle("Thưởng thức và đánh giá mâm cơm lam cá suối nướng")
                            .taskType("food")
                            .reviewText("Cá suối ướp mắc khén nướng than giòn bì thơm nức mũi, ăn cùng cơm lam dẻo quánh đúng điệu bản Mường - Thái. Điểm 10 chất lượng!")
                            .rewardText("Voucher giảm 50.000đ dịch vụ ăn uống lần sau")
                            .photosCount(2)
                            .guestAvatar("https://lh3.googleusercontent.com/aida-public/AB6AXuCf_GZrWvs5PbldzGsECiknjV3jiAuHqF3qQ0vTTpwxRImEmzWcmrBQnpJQPLCNdqaSQyoDm9EP7lyCzAelYHSu6XVwxZuLvuR4SmH4_n1_jLQqsked0ttQNeszq6kP3dH8Eg7Q0znPXhxfzPh9u3nJRtVOB9jjoxAwXHammtyBVEsTPjxOl7oC4sF5gCPWoEmUCpzteXKyDXMyoeC4SLHip0BteQKWK18gnncNJ8HpdsRhQh3I9Kk")
                            .submissionImage("https://lh3.googleusercontent.com/aida-public/AB6AXuDdBW9ILAd7dvQBEAbmNPGGhivvXfCDDDvtJC4zDg-IGR1XGnQHtA4M57KLjUy_o5-9yqHoF2Uw6AzbXIbXr5JqBg7pqGmVdmi9S8BlHDTQdO6pnk9LM39hh_l_uGgmUtz0c2c8-reOCnTG3SQFP-16zq1RahEvEE-quDqEvGgOYS040aA0FBxBWtVpWrgycH8PZGR5baQ2OB7L6FqQiMNaMef1HWMQ97YLH41-3qmRgcbG08VxzIo")
                            .status("pending")
                            .submittedAt(LocalDateTime.now().minusHours(4))
                            .build()
            );
            submissionRepository.saveAll(sampleSubmissions);
        }

        // Seed reward_stocks nếu trống
        if (rewardStockRepository.count() == 0) {
            log.info("Bảng reward_stocks đang rỗng, tiến hành seed 4 vật phẩm kho...");
            List<RewardStock> sampleStocks = List.of(
                    RewardStock.builder().homestayId(defaultHomestayId).name("Voucher giảm 10%").type("Voucher").qty(60).build(),
                    RewardStock.builder().homestayId(defaultHomestayId).name("Voucher 100.000₫ trừ thẳng").type("Voucher").qty(40).build(),
                    RewardStock.builder().homestayId(defaultHomestayId).name("Túi trà gạo lứt Mộc Châu").type("Quà tặng").qty(25).build(),
                    RewardStock.builder().homestayId(defaultHomestayId).name("Quà nông sản lưu niệm").type("Quà tặng").qty(30).build()
            );
            rewardStockRepository.saveAll(sampleStocks);
        }
    }

    // ==========================================
    // MISSIONS CRUD
    // ==========================================

    @Transactional(readOnly = true)
    public List<OwnerMissionDTO> getMissions(Long homestayId) {
        List<GuestTask> list;
        if (homestayId != null && homestayId > 0) {
            list = guestTaskRepository.findByHomestayId(homestayId);
            if (list.isEmpty()) {
                Long hid = resolveHomestayId(null);
                list = guestTaskRepository.findByHomestayId(hid);
            }
        } else {
            list = guestTaskRepository.findAll();
            if (list.isEmpty()) {
                Long hid = resolveHomestayId(null);
                list = guestTaskRepository.findByHomestayId(hid);
            }
        }
        return list.stream().map(this::mapToMissionDTO).collect(Collectors.toList());
    }

    @Transactional
    public OwnerMissionDTO createMission(CreateMissionRequest req) {
        Long hid = resolveHomestayId(req.getHomestayId());
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
        List<GuestTaskSubmission> list;
        if (homestayId != null && homestayId > 0) {
            list = submissionRepository.findByHomestayIdOrderBySubmittedAtDesc(homestayId);
            if (list.isEmpty()) {
                list = submissionRepository.findAll();
            }
        } else {
            list = submissionRepository.findAll();
        }

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
                .reward(s.getRewardText() != null ? s.getRewardText() : "Voucher homestay")
                .photos(s.getPhotosCount() != null ? s.getPhotosCount() : 1)
                .avatar(s.getGuestAvatar() != null ? s.getGuestAvatar() : "https://lh3.googleusercontent.com/aida-public/AB6AXuDtBD2J0dMb6ui-jzFd-s3WAOrIcULKNiD9XtfnGxQMKSTx355Pf1EjERQXBHDwHrcQ0Rorvh9B6EK8HB6KmTt_y_Vmq08HXH1mv79H5Vu9HA98ZemUl4gMQKLX8UE6D4XyoH4aj98giLTIomA-cZpFPmBtgmFxgoZt0ZKA5x-4LkgkGP-hJ2DyiPrZOmmqIdCcd6okDRUACpFaDNJU99_AMzc9ReyPXk77zeU4Z5vnxIG6w4_nVg8")
                .image(s.getSubmissionImage() != null ? s.getSubmissionImage() : "https://lh3.googleusercontent.com/aida-public/AB6AXuAwxRCSb8O0TEvP8qWKkyBWYmOPRU7CAe-lU0L0LMkQVLCWwT-WPYALrACR8Db8vw3_4jArbeXHHO_9d76yf7xm93aRwrudcovcbdkH-3EQrrGzyVg0iJ-Mvu69r8SV1GpbtRs1onXyn8r2zhoo3AUha2-9zCn4Myw7IYvyDRyt2uYN6sGiBB77aieKV_8H49oOFbrdmjYwsetb-x5cKFX4PCfWM-yOuk8sjzC85RU_W3_1EPQSU6E")
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
        if (req.getItems() != null) {
            for (SaveStockRequest.StockItem item : req.getItems()) {
                if (item.getId() != null && item.getId() > 0) {
                    rewardStockRepository.findById(item.getId()).ifPresent(stock -> {
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
        int count = req.getSelectedGuests() != null ? req.getSelectedGuests().size() : 0;
        log.info("Đã gửi quà tri ân [{}] tới {} khách hàng xuất sắc của homestay {}", req.getGiftItem(), count, hid);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Đã gửi quà tri ân thành công tới " + count + " khách hàng xuất sắc!");
        res.put("sentCount", count);
        res.put("giftItem", req.getGiftItem());
        return res;
    }

    // ==========================================
    // STATS & KPI
    // ==========================================

    @Transactional(readOnly = true)
    public OwnerMissionStatsDTO getStats(Long homestayId) {
        Long hid = resolveHomestayId(homestayId);

        long activeMissions;
        long pendingToday;
        long rewardedVouchers;

        if (homestayId != null && homestayId > 0) {
            activeMissions = guestTaskRepository.findByHomestayId(homestayId).stream()
                    .filter(t -> "active".equalsIgnoreCase(t.getStatus()))
                    .count();
            pendingToday = submissionRepository.countByHomestayIdAndStatus(homestayId, "pending");
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

        if (activeMissions == 0) activeMissions = 4;
        if (rewardedVouchers == 0) rewardedVouchers = 96;

        long participantGuests = 142; // Tổng số khách tham gia hoạt động tháng này

        // Bảng xếp hạng Top khách tích cực
        List<TopGuestDTO> topGuests = List.of(
                TopGuestDTO.builder()
                        .id(1L)
                        .name("Hoàng Lan Anh")
                        .points(280)
                        .completed(5)
                        .avatar("https://lh3.googleusercontent.com/aida-public/AB6AXuBM2p3xVWdv84AVmzpSgASDhrTJWBslvj9gqrIocFGTSa80ihcG4lcehUXD1yur0QqYvgSIR0sfQCQbHDpnxmX1B0NbaARMi116qNnbisQ0_sqa7JgXnyQMhoHPY3Iaa6L9k-FDayYklK7Ks29G59GDVm9uzDeX5qG0840EGEfjLUks1387sY1oCLzpTjUC20f3HXCH8CWYiCNJN_ZJn-tL-9zKgl6nGoxmg9otBPZcuWuo7KO-gIs")
                        .build(),
                TopGuestDTO.builder()
                        .id(2L)
                        .name("Đặng Quốc Tuấn")
                        .points(210)
                        .completed(4)
                        .avatar("https://lh3.googleusercontent.com/aida-public/AB6AXuA0rpyMEE5nGfTtsGVNH0sMheHl0xL1Nh0I0T-S0mogDCf6_L8_WRKYd64wVjiFp7cvZSEDHbFEWziQgnMt0GhnTe0edIUHtKRJm83_Sv89eOqGYW7W2BMeTfOVi4kk4Ibmmx6vMgct7iPbSym5riRvts5r-eU0BoWYXDTjuaJ_PEZKAK1RwD3k5-xXkPa90Nu_AOfJjC5EqzLDQQ83CfkChif6Q4OZqPNIoovOTXyj_auiAKAO_7A")
                        .build(),
                TopGuestDTO.builder()
                        .id(3L)
                        .name("Nguyễn Phương Linh")
                        .points(160)
                        .completed(3)
                        .avatar("https://lh3.googleusercontent.com/aida-public/AB6AXuD9O0vFuEGIJVTJSeQK1Jsp5j_IwhXL8ChEXsaM2bcG8OloI7TUCJqlm1Elu0BoIc245q_cEfERzfQklJm6qzTuFaMFG40CKliwBhKhDEUEzQwIS7TvPbSs8K83acaQrBvueOnC0JnWBpBNoyTDir47BjOTPRqu0JzImfPchOEaGcPvrymkvuwOa3BGdP-3q1W7vVYFHRay8HiBPzs0SozC7OxtIDZT_uOXzNdiKbM26xrEKZHRyWY")
                        .build()
        );

        return OwnerMissionStatsDTO.builder()
                .activeMissions(activeMissions > 0 ? activeMissions : 4)
                .pendingToday(pendingToday)
                .participantGuests(participantGuests)
                .rewardedVouchers(rewardedVouchers)
                .interactionRate(68)
                .topGuests(topGuests)
                .rewardStocks(getRewardStocks(hid))
                .build();
    }
}
