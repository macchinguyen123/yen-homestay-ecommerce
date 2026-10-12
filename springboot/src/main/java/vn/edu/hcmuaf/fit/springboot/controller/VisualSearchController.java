package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.hcmuaf.fit.springboot.dto.VisualSearchItemDTO;
import vn.edu.hcmuaf.fit.springboot.service.VisualSearchService;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping({"/api/public/search", "/api/search"})
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class VisualSearchController {

    private final VisualSearchService visualSearchService;

    /**
     * API 1: Tìm kiếm homestay bằng upload file ảnh trực tiếp từ client
     * POST /api/public/search/image hoặc /api/search/image
     */
    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> searchByImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "limit", defaultValue = "8") int limit
    ) {
        try {
            List<VisualSearchItemDTO> results = visualSearchService.searchByImage(file, limit);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "count", results.size(),
                "data", results
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Lỗi tìm kiếm bằng ảnh: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Không thể hoàn thành tìm kiếm bằng ảnh: " + e.getMessage()
            ));
        }
    }

    /**
     * API 2: Tìm kiếm homestay bằng URL ảnh có sẵn
     * POST /api/public/search/image-url
     */
    @PostMapping("/image-url")
    public ResponseEntity<?> searchByImageUrl(
            @RequestBody Map<String, String> payload,
            @RequestParam(value = "limit", defaultValue = "8") int limit
    ) {
        String imageUrl = payload.get("imageUrl");
        if (imageUrl == null || imageUrl.isBlank()) {
            imageUrl = payload.get("image_url");
        }
        try {
            List<VisualSearchItemDTO> results = visualSearchService.searchByImageUrl(imageUrl, limit);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "count", results.size(),
                "data", results
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            log.error("Lỗi tìm kiếm bằng url ảnh: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Không thể tìm kiếm bằng URL ảnh: " + e.getMessage()
            ));
        }
    }

    /**
     * API 3: Đánh index và cập nhật vector cho toàn bộ ảnh hiện có trong database
     * POST /api/public/search/sync-embeddings
     */
    @PostMapping("/sync-embeddings")
    public ResponseEntity<?> syncEmbeddings() {
        try {
            Map<String, Object> report = visualSearchService.syncEmbeddings();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "report", report
            ));
        } catch (Exception e) {
            log.error("Lỗi sync embedding: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Lỗi khi sync vector: " + e.getMessage()
            ));
        }
    }

    /**
     * API 4: Chạy cấu hình khởi tạo extension vector và index trên Neon
     * POST /api/public/search/setup-pgvector
     */
    @PostMapping("/setup-pgvector")
    public ResponseEntity<?> setupPgvector() {
        try {
            visualSearchService.setupPgvectorSchema();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã cấu hình pgvector, thêm cột embedding và tạo chỉ mục HNSW thành công!"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Lỗi cấu hình pgvector: " + e.getMessage()
            ));
        }
    }
}
