package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.GuestTask;

import java.util.List;

@Repository
public interface GuestTaskRepository extends JpaRepository<GuestTask, Long> {
    List<GuestTask> findByHomestayId(Long homestayId);
    List<GuestTask> findByHomestayIdIn(List<Long> homestayIds);
    List<GuestTask> findByHomestayIdAndStatus(Long homestayId, String status);
    List<GuestTask> findByHomestayIdInAndStatus(List<Long> homestayIds, String status);
}
