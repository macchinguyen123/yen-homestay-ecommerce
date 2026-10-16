package vn.edu.hcmuaf.fit.springboot.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vn.edu.hcmuaf.fit.springboot.dto.ChatbotDTO;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.HomestayImage;
import vn.edu.hcmuaf.fit.springboot.repository.FestivalRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayImageRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.VoucherRepository;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final RestTemplate restTemplate;
    private final HomestayRepository homestayRepository;
    private final HomestayImageRepository homestayImageRepository;
    private final VoucherRepository voucherRepository;
    private final FestivalRepository festivalRepository;
    private final JsonMapper objectMapper = new JsonMapper();

    @Value("${ollama.api.url:http://localhost:11434}")
    private String ollamaApiUrl;

    @Value("${ollama.model.name:yen-chatbot}")
    private String ollamaModelName;

    private static final String SYS_EXTRACT =
            "Bạn là trợ lý Yên Homestay. CHỈ trả về MỘT JSON hợp lệ, không thêm chữ nào.\n" +
            "intent: \"search\" (city, category, guests, nights, booking_type, min_price, max_price, min_rating, amenities, extras, sort) | \"voucher\" (code) | \"festival\" (city) | \"reply\" (reply).\n" +
            "Quy tắc: thiếu thông tin thì null (amenities/extras là []); không bịa. Giá VNĐ/đêm, số nguyên. booking_type: whole|room|null. sort: price_asc|price_desc|rating_desc|null. Mũi Né = Phan Thiết. Địa điểm ngoài 12 thành phố hỗ trợ (Huế, Hà Giang, Hà Nội, Hội An, Nha Trang, Ninh Bình, Phan Thiết, Phú Quốc, Sa Pa, Vũng Tàu, Đà Lạt, Đà Nẵng) -> intent \"reply\".";

    private static final String SYS_ANSWER =
            "Bạn là trợ lý AI của Yên Homestay. Hệ thống đã tra dữ liệu thật trong cơ sở dữ liệu và gửi kèm bên dưới.\n" +
            "Quy tắc:\n" +
            "- Trả lời ngắn gọn 1-2 câu tiếng Việt thân thiện, giới thiệu ngay các homestay tìm được.\n" +
            "- Mỗi homestay bắt buộc kèm thẻ [[card:ID]] ở cuối để giao diện hiển thị thẻ.\n" +
            "- Viết giá dạng 1.200.000đ. Tuyệt đối không bịa thông tin ngoài danh sách gửi kèm.\n" +
            "- Nếu dữ liệu rỗng: nói rõ chưa có kết quả và gợi ý khách nới điều kiện.";

    private static final String[] SUPPORTED_CITIES = {
            "Đà Lạt", "Vũng Tàu", "Hà Nội", "Sa Pa", "Nha Trang", "Phú Quốc",
            "Ninh Bình", "Hội An", "Huế", "Hà Giang", "Phan Thiết", "Đà Nẵng"
    };

    public ChatbotDTO.ChatResponse processChat(String userMessage) {
        if (userMessage == null || userMessage.trim().isEmpty()) {
            return ChatbotDTO.ChatResponse.builder()
                    .message("Dạ, bạn cần tìm homestay ở đâu hoặc mức giá như thế nào ạ? Hãy chia sẻ với mình nhé! 🌿")
                    .homestays(Collections.emptyList())
                    .intent("reply")
                    .build();
        }

        userMessage = userMessage.trim();
        String msgLower = userMessage.toLowerCase();

        // --- TỐI ƯU SIÊU TỐC 1: Xử lý chào hỏi tức thì (0ms) ---
        if (msgLower.matches("^(xin chào|chào bạn|chào|hello|hi|alo|hé lô|hey)( nha| nhé| ạ| nè| ban)?$")) {
            return ChatbotDTO.ChatResponse.builder()
                    .message("Dạ Yên Homestay xin chào bạn! 🌿 Mình có thể giúp bạn tìm phòng homestay theo địa điểm (Đà Lạt, Vũng Tàu, Sa Pa, Hà Nội...), mức giá hoặc số lượng khách. Bạn đang dự định đi đâu thế ạ?")
                    .homestays(Collections.emptyList())
                    .intent("reply")
                    .build();
        }

        // --- TỐI ƯU SIÊU TỐC 2: Fast Regex Parser (Bỏ qua Stage 1 LLM tiết kiệm 5-8 giây) ---
        String fastCity = null;
        for (String c : SUPPORTED_CITIES) {
            if (msgLower.contains(c.toLowerCase())) {
                fastCity = c;
                break;
            }
        }
        if (msgLower.contains("mũi né")) fastCity = "Phan Thiết";

        BigDecimal fastMaxPrice = null;
        Matcher priceMatcherK = Pattern.compile("(\\d+)\\s*(k|nghìn|ngàn)").matcher(msgLower);
        if (priceMatcherK.find()) {
            try {
                fastMaxPrice = new BigDecimal(Long.parseLong(priceMatcherK.group(1)) * 1000);
            } catch (Exception ignored) {}
        } else {
            Matcher priceMatcherTr = Pattern.compile("(\\d+([.,]\\d+)?)\\s*(tr|triệu)").matcher(msgLower);
            if (priceMatcherTr.find()) {
                try {
                    double val = Double.parseDouble(priceMatcherTr.group(1).replace(",", "."));
                    fastMaxPrice = new BigDecimal((long) (val * 1000000));
                } catch (Exception ignored) {}
            }
        }

        Integer fastGuests = null;
        Matcher guestMatcher = Pattern.compile("(\\d+)\\s*(người|khách|bạn)").matcher(msgLower);
        if (guestMatcher.find()) {
            try {
                fastGuests = Integer.parseInt(guestMatcher.group(1));
            } catch (Exception ignored) {}
        }

        boolean isFastSearch = (fastCity != null || fastMaxPrice != null || fastGuests != null);
        String rawJson = null;
        JsonNode criteria = null;
        String intent = "search";

        if (!isFastSearch) {
            // Chỉ gọi Stage 1 EXTRACT khi không parse được nhanh bằng Regex
            try {
                String extractPrompt = "<|im_start|>system\n" + SYS_EXTRACT + "<|im_end|>\n"
                        + "<|im_start|>user\n" + userMessage + "<|im_end|>\n"
                        + "<|im_start|>assistant\n";

                rawJson = callOllama(extractPrompt, 80);
                if (rawJson != null && !rawJson.isBlank()) {
                    String cleaned = cleanJson(rawJson);
                    criteria = objectMapper.readTree(cleaned);
                    if (criteria.has("intent")) {
                        intent = criteria.path("intent").asText("search");
                    }
                }
            } catch (Exception e) {
                log.warn("Lỗi khi gọi Stage 1 (EXTRACT): {}", e.getMessage());
            }
        }

        // --- NHỊP 2: QUERY NEON DATABASE ---
        List<Homestay> matchedHomestays = new ArrayList<>();
        StringBuilder dbDataText = new StringBuilder();

        if ("voucher".equalsIgnoreCase(intent) && criteria != null) {
            String code = criteria.path("code").asText(null);
            if (code != null && !code.isBlank()) {
                voucherRepository.findByCodeIgnoreCase(code).ifPresent(v -> {
                    dbDataText.append(String.format("- Mã voucher: %s | Giá trị: %s (%s) | Đơn tối thiểu: %s | Hạn dùng: %s\n",
                            v.getCode(), v.getValue(), v.getDiscountType() != null ? v.getDiscountType() : "", v.getMinOrderValue(), v.getExpiryDate()));
                });
            }
        } else if ("festival".equalsIgnoreCase(intent) && criteria != null) {
            String city = criteria.path("city").asText(null);
            if (city != null && !city.isBlank()) {
                var festivals = festivalRepository.findByCity(city);
                for (var f : festivals) {
                    dbDataText.append(String.format("- Lễ hội: %s | Thành phố: %s | Thời gian: %s đến %s | Mô tả: %s\n",
                            f.getName(), f.getCity(), f.getStartDate(), f.getEndDate(), f.getDescription()));
                }
            }
        } else if ("search".equalsIgnoreCase(intent)) {
            if (isFastSearch) {
                matchedHomestays = searchHomestaysFast(fastCity, fastMaxPrice, fastGuests, userMessage);
            } else {
                matchedHomestays = searchHomestaysByCriteria(criteria, userMessage);
            }

            for (Homestay h : matchedHomestays) {
                String formatted = formatVnd(h.getBasePrice());
                dbDataText.append(String.format("- ID: %d | Tên: %s | Thành phố: %s | Địa chỉ: %s | Giá: %s/đêm | Khách tối đa: %s | Đánh giá: %s sao\n",
                        h.getId(),
                        h.getName(),
                        h.getCity() != null ? h.getCity() : "",
                        h.getAddress() != null ? h.getAddress() : "",
                        formatted,
                        h.getMaxGuests() != null ? h.getMaxGuests() : "2-4",
                        h.getRating() != null ? String.format("%.1f", h.getRating()) : "5.0"));
            }
        } else if ("reply".equalsIgnoreCase(intent) && criteria != null && criteria.has("reply")) {
            String directReply = criteria.path("reply").asText();
            if (directReply != null && !directReply.isBlank()) {
                return ChatbotDTO.ChatResponse.builder()
                        .message(directReply)
                        .homestays(Collections.emptyList())
                        .intent("reply")
                        .criteriaJson(rawJson)
                        .build();
            }
        }

        // --- NHỊP 3: ANSWER (Gọi Ollama sinh câu trả lời ngắn gọn trong 1-2 giây) ---
        String finalReply = "";
        try {
            String answerPrompt = "<|im_start|>system\n" + SYS_ANSWER + "<|im_end|>\n"
                    + "<|im_start|>user\n" + userMessage + "\n[DỮ LIỆU THẬT TỪ HỆ THỐNG]:\n"
                    + (dbDataText.length() > 0 ? dbDataText.toString() : "(Không có homestay nào phù hợp tiêu chí)")
                    + "<|im_end|>\n<|im_start|>assistant\n";

            finalReply = callOllama(answerPrompt, 120);
        } catch (Exception e) {
            log.warn("Lỗi khi gọi Stage 2 (ANSWER): {}. Dùng fallback trả lời.", e.getMessage());
        }

        // Fallback tự nhiên nếu Ollama không chạy hoặc trả về rỗng
        if (finalReply == null || finalReply.isBlank()) {
            if (!matchedHomestays.isEmpty()) {
                StringBuilder fb = new StringBuilder("Dạ, Yên Homestay gợi ý cho bạn các phòng phù hợp dưới đây nhé:\n");
                for (Homestay h : matchedHomestays) {
                    fb.append(String.format("- **%s** (%s) - Giá từ %s/đêm [[card:%d]]\n",
                            h.getName(), h.getCity() != null ? h.getCity() : "", formatVnd(h.getBasePrice()), h.getId()));
                }
                finalReply = fb.toString();
            } else {
                finalReply = "Dạ hiện tại bên mình chưa tìm thấy homestay nào khớp hoàn toàn với yêu cầu này. Bạn thử nới khoảng giá hoặc chọn khu vực trung tâm xem sao nhé!";
            }
        }

        List<ChatbotDTO.HomestayCardDTO> cardDTOs = buildCardDTOs(matchedHomestays);

        return ChatbotDTO.ChatResponse.builder()
                .message(finalReply)
                .homestays(cardDTOs)
                .intent(intent)
                .criteriaJson(rawJson)
                .build();
    }

    private List<Homestay> searchHomestaysFast(String city, BigDecimal maxPrice, Integer guests, String userMessage) {
        List<Homestay> results = new ArrayList<>();
        if (city != null || maxPrice != null || guests != null) {
            results = homestayRepository.filterHomestays(city, null, maxPrice, guests);
        }
        if (results.isEmpty() && city != null) {
            results = homestayRepository.searchByNameOrCityOrAddress(city);
        }
        if (results.isEmpty()) {
            results = homestayRepository.findTop5ByStatusIgnoreCaseOrderByIdDesc("ACTIVE");
        }
        if (results.size() > 4) {
            results = results.subList(0, 4);
        }
        return results;
    }

    private List<Homestay> searchHomestaysByCriteria(JsonNode criteria, String userMessage) {
        String city = null;
        BigDecimal minPrice = null;
        BigDecimal maxPrice = null;
        Integer guests = null;

        if (criteria != null) {
            if (criteria.hasNonNull("city") && !criteria.path("city").asText().isBlank()) {
                city = criteria.path("city").asText().trim();
            }
            if (criteria.hasNonNull("min_price")) {
                minPrice = new BigDecimal(criteria.path("min_price").asLong());
            }
            if (criteria.hasNonNull("max_price")) {
                maxPrice = new BigDecimal(criteria.path("max_price").asLong());
            }
            if (criteria.hasNonNull("guests")) {
                guests = criteria.path("guests").asInt();
            }
        }

        if (city == null || city.isBlank()) {
            for (String c : SUPPORTED_CITIES) {
                if (userMessage.toLowerCase().contains(c.toLowerCase())) {
                    city = c;
                    break;
                }
            }
        }

        List<Homestay> results = new ArrayList<>();
        if (city != null || minPrice != null || maxPrice != null || guests != null) {
            results = homestayRepository.filterHomestays(city, minPrice, maxPrice, guests);
        }

        if (results.isEmpty() && city != null) {
            results = homestayRepository.searchByNameOrCityOrAddress(city);
        }

        if (results.isEmpty()) {
            results = homestayRepository.findTop5ByStatusIgnoreCaseOrderByIdDesc("ACTIVE");
        }

        if (results.size() > 4) {
            results = results.subList(0, 4);
        }

        return results;
    }

    private List<ChatbotDTO.HomestayCardDTO> buildCardDTOs(List<Homestay> homestays) {
        if (homestays == null || homestays.isEmpty()) return Collections.emptyList();

        List<Long> ids = homestays.stream().map(Homestay::getId).collect(Collectors.toList());
        List<HomestayImage> images = homestayImageRepository.findByHomestayIdIn(ids);

        Map<Long, String> imageMap = new HashMap<>();
        for (HomestayImage img : images) {
            if (Boolean.TRUE.equals(img.getIsPrimary()) || !imageMap.containsKey(img.getHomestayId())) {
                imageMap.put(img.getHomestayId(), img.getImageUrl());
            }
        }

        List<ChatbotDTO.HomestayCardDTO> list = new ArrayList<>();
        for (Homestay h : homestays) {
            String imgUrl = imageMap.getOrDefault(h.getId(), "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80");
            list.add(ChatbotDTO.HomestayCardDTO.builder()
                    .id(h.getId())
                    .name(h.getName())
                    .city(h.getCity())
                    .address(h.getAddress())
                    .price(h.getBasePrice())
                    .formattedPrice(formatVnd(h.getBasePrice()))
                    .rating(h.getRating() != null ? h.getRating() : 5.0)
                    .imageUrl(imgUrl)
                    .maxGuests(h.getMaxGuests())
                    .build());
        }
        return list;
    }

    private String callOllama(String prompt, int maxTokens) {
        String url = ollamaApiUrl.replaceAll("/+$", "") + "/api/generate";
        Map<String, Object> req = new HashMap<>();
        req.put("model", ollamaModelName);
        req.put("prompt", prompt);
        req.put("stream", false);
        
        Map<String, Object> options = new HashMap<>();
        options.put("temperature", 0.1);
        options.put("num_predict", maxTokens > 0 ? maxTokens : 120);
        options.put("num_ctx", 1024);
        req.put("options", options);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(req, headers);

        Map resp = restTemplate.postForObject(url, entity, Map.class);
        if (resp != null && resp.containsKey("response")) {
            return String.valueOf(resp.get("response")).trim();
        }
        return "";
    }

    private String cleanJson(String raw) {
        if (raw == null) return "{}";
        String s = raw.trim();
        if (s.startsWith("```json")) s = s.substring(7);
        else if (s.startsWith("```")) s = s.substring(3);
        if (s.endsWith("```")) s = s.substring(0, s.length() - 3);
        s = s.trim();

        int start = s.indexOf('{');
        int end = s.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return s.substring(start, end + 1);
        }
        return s;
    }

    private String formatVnd(BigDecimal amount) {
        if (amount == null) return "0đ";
        NumberFormat nf = NumberFormat.getInstance(new Locale("vi", "VN"));
        return nf.format(amount) + "đ";
    }
}
