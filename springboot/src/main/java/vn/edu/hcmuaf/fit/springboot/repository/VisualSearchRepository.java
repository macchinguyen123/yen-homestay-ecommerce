package vn.edu.hcmuaf.fit.springboot.repository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.dto.VisualSearchItemDTO;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Repository
@RequiredArgsConstructor
public class VisualSearchRepository {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Tìm kiếm top homestay theo khoảng cách Cosine với vector truy vấn (512 chiều)
     * Sử dụng ROW_NUMBER() để mỗi homestay chỉ xuất hiện 1 lần với ảnh khớp nhất
     */
    public List<VisualSearchItemDTO> searchSimilarHomestays(String vectorString, int limit) {
        String sql = """
            WITH ranked AS (
                SELECT 
                    h.homestay_id,
                    h.name,
                    h.city,
                    h.address,
                    h.base_price,
                    h.rating,
                    hi.image_url AS matched_image_url,
                    (1.0 - (hi.embedding <=> cast(? as vector))) AS raw_similarity,
                    (hi.embedding <=> cast(? as vector)) AS distance,
                    ROW_NUMBER() OVER(PARTITION BY h.homestay_id ORDER BY (hi.embedding <=> cast(? as vector)) ASC) as rn
                FROM homestay_images hi
                JOIN homestays h ON hi.homestay_id = h.homestay_id
                WHERE hi.embedding IS NOT NULL AND h.status = 'ACTIVE'
            )
            SELECT 
                homestay_id, 
                name, 
                city, 
                address, 
                base_price, 
                rating, 
                matched_image_url, 
                raw_similarity, 
                distance
            FROM ranked
            WHERE rn = 1
            ORDER BY distance ASC
            LIMIT ?;
        """;

        return jdbcTemplate.query(
            sql,
            (rs, rowNum) -> {
                double rawSim = rs.getDouble("raw_similarity");
                // Chuẩn hóa phần trăm tương đồng (0% - 100%)
                double similarityPercent = Math.max(0.0, Math.min(100.0, rawSim * 100.0));
                similarityPercent = Math.round(similarityPercent * 10.0) / 10.0;

                double distance = rs.getDouble("distance");
                distance = Math.round(distance * 1000.0) / 1000.0;

                return VisualSearchItemDTO.builder()
                    .homestayId(rs.getLong("homestay_id"))
                    .name(rs.getString("name"))
                    .city(rs.getString("city"))
                    .address(rs.getString("address"))
                    .basePrice(rs.getBigDecimal("base_price"))
                    .rating(rs.getDouble("rating"))
                    .matchedImageUrl(rs.getString("matched_image_url"))
                    .similarity(similarityPercent)
                    .distance(distance)
                    .build();
            },
            vectorString,
            vectorString,
            vectorString,
            limit
        );
    }

    /**
     * Cập nhật vector embedding cho một bức ảnh homestay
     */
    public void updateHomestayImageEmbedding(Long imageId, String vectorString) {
        String sql = "UPDATE homestay_images SET embedding = cast(? as vector) WHERE image_id = ?";
        jdbcTemplate.update(sql, vectorString, imageId);
    }

    /**
     * Lấy danh sách ảnh chưa có vector embedding
     */
    public List<HomestayImageRecord> findImagesWithoutEmbedding() {
        String sql = "SELECT image_id, homestay_id, image_url FROM homestay_images WHERE embedding IS NULL AND image_url IS NOT NULL";
        return jdbcTemplate.query(sql, (rs, rowNum) -> new HomestayImageRecord(
            rs.getLong("image_id"),
            rs.getLong("homestay_id"),
            rs.getString("image_url")
        ));
    }

    /**
     * Tự động khởi tạo Extension pgvector và Index HNSW nếu chưa có
     */
    public void setupPgvectorSchema() {
        try {
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector;");
            log.info("Extension pgvector đã sẵn sàng.");
        } catch (Exception e) {
            log.warn("Không thể tạo extension vector (có thể đã có hoặc cần quyền superuser): {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE homestay_images ADD COLUMN IF NOT EXISTS embedding vector(512);");
            log.info("Cột embedding vector(512) trong homestay_images đã sẵn sàng.");
        } catch (Exception e) {
            log.warn("Lỗi khi thêm cột embedding: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("""
                CREATE INDEX IF NOT EXISTS idx_homestay_images_embedding_hnsw 
                ON homestay_images 
                USING hnsw (embedding vector_cosine_ops)
                WITH (m = 16, ef_construction = 64);
            """);
            log.info("Chỉ mục HNSW cosine distance đã sẵn sàng.");
        } catch (Exception e) {
            log.warn("Lỗi khi tạo chỉ mục HNSW: {}", e.getMessage());
        }
    }

    public record HomestayImageRecord(Long imageId, Long homestayId, String imageUrl) {}
}
