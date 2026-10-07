package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.ViewedHistory;

import java.util.List;
import java.util.Optional;

@Repository
public interface ViewedHistoryRepository extends JpaRepository<ViewedHistory, Long> {
    Optional<ViewedHistory> findByUserIdAndHomestayId(Long userId, Long homestayId);
    List<ViewedHistory> findByUserIdOrderByViewedAtDesc(Long userId);
    void deleteByUserIdAndHomestayId(Long userId, Long homestayId);
    void deleteByUserId(Long userId);
}
