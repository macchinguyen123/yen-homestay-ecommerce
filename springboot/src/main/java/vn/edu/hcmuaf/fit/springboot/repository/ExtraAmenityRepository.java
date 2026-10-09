package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.ExtraAmenity;

import java.util.List;

@Repository
public interface ExtraAmenityRepository extends JpaRepository<ExtraAmenity, Long> {
    List<ExtraAmenity> findByHomestayId(Long homestayId);
    List<ExtraAmenity> findByHomestayIdOrderByIdDesc(Long homestayId);
    long countByHomestayId(Long homestayId);
}
