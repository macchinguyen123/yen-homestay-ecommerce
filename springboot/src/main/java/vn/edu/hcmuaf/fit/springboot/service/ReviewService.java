package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import vn.edu.hcmuaf.fit.springboot.dto.ReviewDTO;
import vn.edu.hcmuaf.fit.springboot.dto.ReviewStatsDTO;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final JdbcTemplate jdbcTemplate;

    private static final String SELECT_JOINED_REVIEWS =
            "SELECT r.review_id, r.booking_id, r.homestay_id, h.name as homestay_name, " +
            "b.room_id, rm.room_name, " +
            "r.tourist_id, u.full_name, u.email, u.avatar, " +
            "r.rating, r.comment, r.images, r.owner_reply, r.created_at " +
            "FROM reviews r " +
            "LEFT JOIN homestays h ON r.homestay_id = h.homestay_id " +
            "LEFT JOIN bookings b ON r.booking_id = b.booking_id " +
            "LEFT JOIN rooms rm ON b.room_id = rm.room_id " +
            "LEFT JOIN users u ON r.tourist_id = u.user_id ";

    /**
     * Lấy toàn bộ đánh giá thực tế của một Homestay từ CSDL
     */
    public List<ReviewDTO> getReviewsByHomestayId(Long homestayId) {
        String sql = SELECT_JOINED_REVIEWS + "WHERE r.homestay_id = ? ORDER BY r.created_at DESC NULLS LAST";
        try {
            return jdbcTemplate.query(sql, this::mapRowToReviewDTO, homestayId);
        } catch (Exception e) {
            log.error("Lỗi khi truy vấn đánh giá homestay {}: {}", homestayId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Lấy danh sách đánh giá thực tế của một Phòng cụ thể từ CSDL
     */
    public List<ReviewDTO> getReviewsByRoomId(Long roomId) {
        String sql = SELECT_JOINED_REVIEWS + "WHERE b.room_id = ? ORDER BY r.created_at DESC NULLS LAST";
        try {
            return jdbcTemplate.query(sql, this::mapRowToReviewDTO, roomId);
        } catch (Exception e) {
            log.error("Lỗi khi truy vấn đánh giá phòng {}: {}", roomId, e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * Lấy thống kê số lượng và điểm đánh giá thực tế của Homestay từ CSDL
     */
    public ReviewStatsDTO getReviewStatsByHomestayId(Long homestayId) {
        String sqlCount = "SELECT COUNT(*) FROM reviews WHERE homestay_id = ?";
        String sqlAvg = "SELECT AVG(rating) FROM reviews WHERE homestay_id = ?";
        String sqlBreakdown = "SELECT rating, COUNT(*) as cnt FROM reviews WHERE homestay_id = ? GROUP BY rating";

        long total = 0;
        double avg = 0.0;
        Map<Integer, Long> starCounts = new HashMap<>();
        for (int i = 1; i <= 5; i++) starCounts.put(i, 0L);

        try {
            Long c = jdbcTemplate.queryForObject(sqlCount, Long.class, homestayId);
            if (c != null) total = c;

            Double a = jdbcTemplate.queryForObject(sqlAvg, Double.class, homestayId);
            if (a != null) avg = Math.round(a * 10.0) / 10.0;

            jdbcTemplate.query(sqlBreakdown, (rs) -> {
                int star = rs.getInt("rating");
                long count = rs.getLong("cnt");
                starCounts.put(star, count);
            }, homestayId);

        } catch (Exception e) {
            log.error("Lỗi khi lấy thống kê đánh giá homestay {}: {}", homestayId, e.getMessage());
        }

        return ReviewStatsDTO.builder()
                .homestayId(homestayId)
                .totalReviews(total)
                .averageRating(avg)
                .starCounts(starCounts)
                .build();
    }

    private ReviewDTO mapRowToReviewDTO(ResultSet rs, int rowNum) throws SQLException {
        Timestamp ts = rs.getTimestamp("created_at");
        LocalDateTime createdAt = ts != null ? ts.toLocalDateTime() : null;
        String formattedDate = "Gần đây";
        if (createdAt != null) {
            formattedDate = String.format("Tháng %d, %d", createdAt.getMonthValue(), createdAt.getYear());
        }

        String rawImages = rs.getString("images");
        List<String> images = new ArrayList<>();
        if (rawImages != null && !rawImages.trim().isEmpty()) {
            for (String img : rawImages.split("[,;]")) {
                if (!img.trim().isEmpty()) images.add(img.trim());
            }
        }

        String touristName = rs.getString("full_name");
        if (touristName == null || touristName.trim().isEmpty()) {
            touristName = "Khách du lịch";
        }

        String roomName = rs.getString("room_name");
        if (roomName == null || roomName.trim().isEmpty()) {
            roomName = "Phòng tiêu chuẩn";
        }

        return ReviewDTO.builder()
                .id(rs.getLong("review_id"))
                .bookingId(rs.getLong("booking_id"))
                .homestayId(rs.getLong("homestay_id"))
                .homestayName(rs.getString("homestay_name"))
                .roomId(rs.getObject("room_id") != null ? rs.getLong("room_id") : null)
                .roomName(roomName)
                .touristId(rs.getLong("tourist_id"))
                .touristName(touristName)
                .touristEmail(rs.getString("email"))
                .touristAvatar(rs.getString("avatar"))
                .rating(rs.getInt("rating"))
                .comment(rs.getString("comment"))
                .images(images)
                .ownerReply(rs.getString("owner_reply"))
                .createdAt(createdAt)
                .formattedDate(formattedDate)
                .build();
    }
}
