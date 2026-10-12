package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.GuestTaskSubmission;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuestTaskSubmissionRepository extends JpaRepository<GuestTaskSubmission, Long> {
    List<GuestTaskSubmission> findByHomestayIdOrderBySubmittedAtDesc(Long homestayId);
    List<GuestTaskSubmission> findByHomestayIdAndStatusOrderBySubmittedAtDesc(Long homestayId, String status);
    Optional<GuestTaskSubmission> findBySubmissionCode(String submissionCode);
    long countByHomestayIdAndStatus(Long homestayId, String status);
}
