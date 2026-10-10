package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.AdSlot;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdSlotRepository extends JpaRepository<AdSlot, Long> {
    Optional<AdSlot> findByCode(String code);
    List<AdSlot> findByStatus(String status);
    List<AdSlot> findByPageArea(String pageArea);
}
