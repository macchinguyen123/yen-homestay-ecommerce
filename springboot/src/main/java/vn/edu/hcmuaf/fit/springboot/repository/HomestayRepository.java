package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;

import java.util.List;

@Repository
public interface HomestayRepository extends JpaRepository<Homestay, Long> {
    List<Homestay> findByOwnerId(Long ownerId);
    List<Homestay> findByCategoryId(Long categoryId);
    List<Homestay> findByCity(String city);
    List<Homestay> findByStatus(String status);
}
