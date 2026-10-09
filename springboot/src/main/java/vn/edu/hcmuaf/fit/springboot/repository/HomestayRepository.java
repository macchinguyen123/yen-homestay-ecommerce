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
    List<Homestay> findByCityIgnoreCase(String city);
    List<Homestay> findByStatus(String status);
    long countByStatusIgnoreCase(String status);

    @org.springframework.data.jpa.repository.Query("SELECT h.city, COUNT(h) FROM Homestay h WHERE h.city IS NOT NULL AND h.city != '' GROUP BY h.city ORDER BY COUNT(h) DESC")
    List<Object[]> countHomestaysByCity();

    @org.springframework.data.jpa.repository.Query("SELECT h FROM Homestay h WHERE " +
           "LOWER(h.name) LIKE LOWER(CONCAT('%', :kw, '%')) OR " +
           "LOWER(h.city) LIKE LOWER(CONCAT('%', :kw, '%'))")
    List<Homestay> searchByNameOrCity(@org.springframework.data.repository.query.Param("kw") String kw);

    @org.springframework.data.jpa.repository.Query("SELECT h FROM Homestay h WHERE " +
           "LOWER(h.name) LIKE LOWER(CONCAT('%', :kw, '%')) OR " +
           "LOWER(h.city) LIKE LOWER(CONCAT('%', :kw, '%')) OR " +
           "LOWER(h.address) LIKE LOWER(CONCAT('%', :kw, '%'))")
    List<Homestay> searchByNameOrCityOrAddress(@org.springframework.data.repository.query.Param("kw") String kw);
}

