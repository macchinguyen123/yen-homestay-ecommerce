package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.Report;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByReporterId(Long reporterId);
    List<Report> findByReportedHomestayId(Long homestayId);
    Optional<Report> findFirstByBookingId(Long bookingId);
    List<Report> findByBookingId(Long bookingId);
    List<Report> findByBookingIdIn(List<Long> bookingIds);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query(value = "ALTER TABLE reports ALTER COLUMN booking_id DROP NOT NULL; " +
                   "ALTER TABLE reports ALTER COLUMN reporter_id DROP NOT NULL; " +
                   "UPDATE reports SET status = 'PENDING' WHERE status IS NULL OR UPPER(status) NOT IN ('PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED'); " +
                   "ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check; " +
                   "ALTER TABLE reports ADD CONSTRAINT reports_status_check CHECK (UPPER(status) IN ('PENDING', 'INVESTIGATING', 'RESOLVED', 'REJECTED'));", nativeQuery = true)
    void dropAndRecreateStatusConstraint();

    @Query("SELECT r FROM Report r ORDER BY r.createdAt DESC, r.id DESC")
    List<Report> findAllOrderByCreatedAtDesc();

    long countByStatusIgnoreCase(String status);
    long countByDirectionIgnoreCase(String direction);

    @Query("SELECT r FROM Report r WHERE " +
           "(:direction IS NULL OR LOWER(r.direction) = LOWER(:direction)) AND " +
           "(:status IS NULL OR LOWER(r.status) = LOWER(:status)) AND " +
           "(:severity IS NULL OR LOWER(r.severity) = LOWER(:severity)) AND " +
           "(:keyword IS NULL OR LOWER(COALESCE(r.complaintCode, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(COALESCE(r.bookingCode, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(COALESCE(r.reporterName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(COALESCE(r.reportedName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(COALESCE(r.reportedHomestayName, '')) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           " LOWER(COALESCE(r.title, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY r.createdAt DESC, r.id DESC")
    List<Report> filterComplaints(
            @Param("direction") String direction,
            @Param("status") String status,
            @Param("severity") String severity,
            @Param("keyword") String keyword
    );
}
