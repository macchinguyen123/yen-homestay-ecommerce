package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.edu.hcmuaf.fit.springboot.model.FestivalHomestay;
import java.util.List;

public interface FestivalHomestayRepository extends JpaRepository<FestivalHomestay, Long> {
    List<FestivalHomestay> findByFestivalIdOrderByDisplayOrderAscIdAsc(Long festivalId);
    @Modifying
    @Query("delete from FestivalHomestay x where x.festivalId = :id")
    void deleteAllForFestival(@Param("id") Long id);
}
