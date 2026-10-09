package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.HomestayImage;

import java.util.List;
import java.util.Set;

@Repository
public interface HomestayImageRepository extends JpaRepository<HomestayImage, Long> {
    List<HomestayImage> findByHomestayId(Long homestayId);
    List<HomestayImage> findByHomestayIdIn(Set<Long> homestayIds);
}
