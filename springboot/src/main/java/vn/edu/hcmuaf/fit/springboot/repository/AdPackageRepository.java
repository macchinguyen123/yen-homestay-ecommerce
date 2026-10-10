package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.AdPackage;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdPackageRepository extends JpaRepository<AdPackage, Long> {
    Optional<AdPackage> findByCode(String code);
    List<AdPackage> findByStatus(String status);
    long countByStatus(String status);
    List<AdPackage> findByNameContainingIgnoreCase(String name);
}
