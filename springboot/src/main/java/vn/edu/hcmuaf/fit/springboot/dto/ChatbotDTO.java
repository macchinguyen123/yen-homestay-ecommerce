package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

public class ChatbotDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatRequest {
        private String message;
        private Long conversationId;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChatResponse {
        private String message;
        private List<HomestayCardDTO> homestays;
        private String intent;
        private String criteriaJson;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HomestayCardDTO {
        private Long id;
        private String name;
        private String city;
        private String address;
        private BigDecimal price;
        private String formattedPrice;
        private Double rating;
        private String imageUrl;
        private Integer maxGuests;
    }
}
