package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.HomestayAd;

import java.util.List;

@Repository
public interface HomestayAdRepository extends JpaRepository<HomestayAd, Long> {
    List<HomestayAd> findByOwnerId(Long ownerId);
    List<HomestayAd> findByHomestayId(Long homestayId);
}
