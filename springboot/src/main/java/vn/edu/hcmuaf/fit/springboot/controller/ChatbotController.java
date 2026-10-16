package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.ChatbotDTO;
import vn.edu.hcmuaf.fit.springboot.service.ChatbotService;

import java.util.Map;

@RestController
@RequestMapping("/api/public/chatbot")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ChatbotController {

    private final ChatbotService chatbotService;

    @PostMapping("/message")
    public ResponseEntity<ChatbotDTO.ChatResponse> chat(@RequestBody ChatbotDTO.ChatRequest request) {
        log.info("Nhận tin nhắn chatbot từ khách: {}", request != null ? request.getMessage() : "null");
        String message = request != null ? request.getMessage() : "";
        ChatbotDTO.ChatResponse response = chatbotService.processChat(message);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "Yen Homestay 2-Stage AI Chatbot",
                "pipeline", "EXTRACT -> DB QUERY -> ANSWER"
        ));
    }
}
