package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.Review;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByHomestayId(Long homestayId);
    List<Review> findByTouristId(Long touristId);
    java.util.Optional<Review> findFirstByBookingId(Long bookingId);
    List<Review> findByBookingId(Long bookingId);
}
