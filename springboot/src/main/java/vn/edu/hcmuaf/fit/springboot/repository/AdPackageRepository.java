package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.AdPackage;

import java.util.List;

@Repository
public interface AdPackageRepository extends JpaRepository<AdPackage, Long> {
    List<AdPackage> findByStatus(String status);
}
