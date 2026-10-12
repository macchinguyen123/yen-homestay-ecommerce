package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.hcmuaf.fit.springboot.dto.FastApiVectorResponse;
import vn.edu.hcmuaf.fit.springboot.dto.VisualSearchItemDTO;
import vn.edu.hcmuaf.fit.springboot.repository.VisualSearchRepository;

import java.io.IOException;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisualSearchService {

    private final VisualSearchRepository visualSearchRepository;
    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    /**
     * Tìm kiếm homestay bằng file ảnh người dùng tải lên
     */
    public List<VisualSearchItemDTO> searchByImage(MultipartFile file, int limit) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng tải lên một file ảnh hợp lệ.");
        }

        try {
            // 1. Gửi file ảnh sang Python FastAPI để trích xuất vector CLIP 512 chiều
            List<Double> vector = extractVectorFromFile(file);
            if (vector == null || vector.isEmpty()) {
                throw new IllegalStateException("Không nhận được vector từ AI Service.");
            }

            // 2. Chuyển vector thành chuỗi định dạng PostgreSQL vector: [0.123, -0.456, ...]
            String vectorString = formatVectorToString(vector);

            // 3. Tìm kiếm trong Neon PostgreSQL bằng pgvector (Cosine distance)
            return visualSearchRepository.searchSimilarHomestays(vectorString, limit);

        } catch (Exception e) {
            log.error("Lỗi khi tìm kiếm bằng hình ảnh: {}", e.getMessage(), e);
            throw new RuntimeException("Tìm kiếm bằng hình ảnh thất bại: " + e.getMessage(), e);
        }
    }

    /**
     * Tìm kiếm homestay bằng URL ảnh
     */
    public List<VisualSearchItemDTO> searchByImageUrl(String imageUrl, int limit) {
        if (imageUrl == null || imageUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng cung cấp URL ảnh hợp lệ.");
        }

        try {
            List<Double> vector = extractVectorFromUrl(imageUrl.trim());
            if (vector == null || vector.isEmpty()) {
                throw new IllegalStateException("Không nhận được vector từ AI Service.");
            }

            String vectorString = formatVectorToString(vector);
            return visualSearchRepository.searchSimilarHomestays(vectorString, limit);

        } catch (Exception e) {
            log.error("Lỗi khi tìm kiếm bằng URL ảnh: {}", e.getMessage(), e);
            throw new RuntimeException("Tìm kiếm bằng URL ảnh thất bại: " + e.getMessage(), e);
        }
    }

    /**
     * Đồng bộ / Đánh index vector cho toàn bộ ảnh hiện có trong database (Sync data cũ)
     */
    public Map<String, Object> syncEmbeddings() {
        long startTime = System.currentTimeMillis();
        List<VisualSearchRepository.HomestayImageRecord> images = visualSearchRepository.findImagesWithoutEmbedding();

        int total = images.size();
        int success = 0;
        int failed = 0;
        List<String> failedImages = new ArrayList<>();

        log.info("Bắt đầu đồng bộ vector cho {} ảnh homestay...", total);

        for (VisualSearchRepository.HomestayImageRecord img : images) {
            try {
                List<Double> vector = extractVectorFromUrl(img.imageUrl());
                if (vector != null && !vector.isEmpty()) {
                    String vectorStr = formatVectorToString(vector);
                    visualSearchRepository.updateHomestayImageEmbedding(img.imageId(), vectorStr);
                    success++;
                } else {
                    failed++;
                    failedImages.add("ImageID " + img.imageId() + ": Empty vector");
                }
            } catch (Exception e) {
                failed++;
                failedImages.add("ImageID " + img.imageId() + ": " + e.getMessage());
                log.warn("Lỗi sync vector cho imageId {}: {}", img.imageId(), e.getMessage());
            }
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("Hoàn tất sync vector: {} thành công, {} thất bại trong {}ms", success, failed, duration);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total", total);
        result.put("success", success);
        result.put("failed", failed);
        result.put("durationMs", duration);
        result.put("failedImages", failedImages);
        return result;
    }

    /**
     * Gọi endpoint tạo bảng và index pgvector
     */
    public void setupPgvectorSchema() {
        visualSearchRepository.setupPgvectorSchema();
    }

    // --- Private Helper Methods ---

    private List<Double> extractVectorFromFile(MultipartFile file) throws IOException {
        String endpoint = aiServiceUrl + "/extract-vector-file";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename() != null ? file.getOriginalFilename() : "upload.jpg";
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<FastApiVectorResponse> response = restTemplate.postForEntity(
            endpoint,
            requestEntity,
            FastApiVectorResponse.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            return response.getBody().getEmbedding();
        }
        return Collections.emptyList();
    }

    private List<Double> extractVectorFromUrl(String imageUrl) {
        String endpoint = aiServiceUrl + "/extract-vector-url";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of("image_url", imageUrl);
        HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<FastApiVectorResponse> response = restTemplate.postForEntity(
            endpoint,
            requestEntity,
            FastApiVectorResponse.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            return response.getBody().getEmbedding();
        }
        return Collections.emptyList();
    }

    private String formatVectorToString(List<Double> vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.size(); i++) {
            sb.append(vector.get(i));
            if (i < vector.size() - 1) {
                sb.append(",");
            }
        }
        sb.append("]");
        return sb.toString();
    }
}
