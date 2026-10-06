package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.Booking;

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

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(b.totalPrice), 0) FROM Booking b WHERE UPPER(b.status) IN ('PAID', 'COMPLETED', 'SUCCESS')")
    java.math.BigDecimal sumTotalRevenue();
}

