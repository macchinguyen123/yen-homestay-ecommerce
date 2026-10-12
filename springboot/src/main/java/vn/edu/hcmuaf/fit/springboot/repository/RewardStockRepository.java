package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.RewardStock;

import java.util.List;

@Repository
public interface RewardStockRepository extends JpaRepository<RewardStock, Long> {
    List<RewardStock> findByHomestayIdOrderByIdAsc(Long homestayId);
}
