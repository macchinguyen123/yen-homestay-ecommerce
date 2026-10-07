package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.Wishlist;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByTouristId(Long touristId);
    boolean existsByTouristIdAndHomestayId(Long touristId, Long homestayId);
    Optional<Wishlist> findByTouristIdAndHomestayId(Long touristId, Long homestayId);
}
