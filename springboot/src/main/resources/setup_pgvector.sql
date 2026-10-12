-- ====================================================================
-- HƯỚNG DẪN CẤU HÌNH PGVECTOR TRÊN NEON POSTGRESQL CHO TÍNH NĂNG VISUAL SEARCH
-- Mô hình CLIP: openai/clip-vit-base-patch32 (Vector 512 chiều)
-- ====================================================================

-- 1. Bật extension pgvector (Neon đã hỗ trợ sẵn)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Thêm cột embedding 512 chiều vào bảng homestay_images
ALTER TABLE homestay_images 
ADD COLUMN IF NOT EXISTS embedding vector(512);

-- 3. (Tùy chọn) Thêm cột embedding 512 chiều vào bảng room_images nếu muốn tìm chi tiết từng phòng
ALTER TABLE room_images 
ADD COLUMN IF NOT EXISTS embedding vector(512);

-- 4. Tạo chỉ mục HNSW (Hierarchical Navigable Small World) tối ưu tìm kiếm Cosine Distance (<=>)
-- Tham số vector_cosine_ops phù hợp nhất với đặc trưng ảnh CLIP đã được L2-normalize
CREATE INDEX IF NOT EXISTS idx_homestay_images_embedding_hnsw 
ON homestay_images 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_room_images_embedding_hnsw 
ON room_images 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 5. Ví dụ câu lệnh truy vấn tìm Top 10 homestay có khoảng cách Cosine nhỏ nhất:
-- (:query_vector là chuỗi format '[0.012, -0.045, ...]')
-- Khoảng cách Cosine: 0 = giống hệt 100%, 2 = hoàn toàn trái ngược
-- Độ tương đồng Similarity % = (1 - (embedding <=> :query_vector)) * 100
/*
SELECT 
    h.homestay_id,
    h.name,
    h.city,
    h.base_price,
    hi.image_url,
    (1 - (hi.embedding <=> '[0.012, -0.045, ...]')) AS similarity
FROM homestay_images hi
JOIN homestays h ON hi.homestay_id = h.homestay_id
WHERE hi.embedding IS NOT NULL
ORDER BY hi.embedding <=> '[0.012, -0.045, ...]' ASC
LIMIT 10;
*/
