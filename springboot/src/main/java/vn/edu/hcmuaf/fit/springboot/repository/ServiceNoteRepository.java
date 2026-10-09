package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.ServiceNote;

import java.util.List;

@Repository
public interface ServiceNoteRepository extends JpaRepository<ServiceNote, Long> {
    List<ServiceNote> findByHomestayIdOrderByIdAsc(Long homestayId);
}
