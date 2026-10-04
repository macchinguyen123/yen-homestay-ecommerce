package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.BookingExtra;
import vn.edu.hcmuaf.fit.springboot.model.BookingExtraId;

import java.util.List;

@Repository
public interface BookingExtraRepository extends JpaRepository<BookingExtra, BookingExtraId> {
    List<BookingExtra> findByBookingId(Long bookingId);
}
