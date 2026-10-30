package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.Booking;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    Optional<Booking> findByBookingCode(String bookingCode);
    List<Booking> findByTouristId(Long touristId);
    List<Booking> findByHomestayId(Long homestayId);
    long countByStatusIgnoreCase(String status);
    List<Booking> findTop10ByOrderByCreatedAtDesc();
    List<Booking> findTop10ByStatusIgnoreCaseOrderByCreatedAtDesc(String status);

    @Query("SELECT COALESCE(SUM(b.totalPrice), 0) FROM Booking b WHERE UPPER(b.status) IN ('PAID', 'COMPLETED', 'SUCCESS')")
    java.math.BigDecimal sumTotalRevenue();

    /**
     * Tìm các booking đang có giao thoa lịch với khoảng ngày checkInDate -> checkOutDate của một phòng
     */
    @Query("""
        SELECT b FROM Booking b 
        WHERE b.roomId = :roomId 
          AND LOWER(COALESCE(b.status, '')) NOT LIKE '%cancel%'
          AND LOWER(COALESCE(b.status, '')) NOT LIKE '%reject%'
          AND LOWER(COALESCE(b.status, '')) NOT LIKE '%hủy%'
          AND b.checkInDate < :checkOutDate 
          AND b.checkOutDate > :checkInDate
    """)
    List<Booking> findConflictsByRoom(
        @Param("roomId") Long roomId,
        @Param("checkInDate") LocalDate checkInDate,
        @Param("checkOutDate") LocalDate checkOutDate
    );

    /**
     * Lấy các lịch đặt phòng sắp tới (từ ngày fromDate trở đi) của một phòng để frontend hiển thị lịch kín
     */
    @Query("""
        SELECT b FROM Booking b 
        WHERE b.roomId = :roomId 
          AND LOWER(COALESCE(b.status, '')) NOT LIKE '%cancel%'
          AND LOWER(COALESCE(b.status, '')) NOT LIKE '%reject%'
          AND LOWER(COALESCE(b.status, '')) NOT LIKE '%hủy%'
          AND b.checkOutDate >= :fromDate
        ORDER BY b.checkInDate ASC
    """)
    List<Booking> findBusyBookingsByRoom(
        @Param("roomId") Long roomId,
        @Param("fromDate") LocalDate fromDate
    );

    /**
     * Lấy các lịch đặt phòng sắp tới của cả homestay
     */
    @Query("""
        SELECT b FROM Booking b 
        WHERE b.homestayId = :homestayId 
          AND LOWER(COALESCE(b.status, '')) NOT LIKE '%cancel%'
          AND LOWER(COALESCE(b.status, '')) NOT LIKE '%reject%'
          AND LOWER(COALESCE(b.status, '')) NOT LIKE '%hủy%'
          AND b.checkOutDate >= :fromDate
        ORDER BY b.checkInDate ASC
    """)
    List<Booking> findBusyBookingsByHomestay(
        @Param("homestayId") Long homestayId,
        @Param("fromDate") LocalDate fromDate
    );
}

