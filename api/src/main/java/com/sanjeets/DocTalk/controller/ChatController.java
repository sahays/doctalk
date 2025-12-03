package com.sanjeets.DocTalk.controller;

import com.sanjeets.DocTalk.model.entity.ChatMessage;
import com.sanjeets.DocTalk.model.entity.ChatSession;
import com.sanjeets.DocTalk.service.ChatService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatController {

    private static final Logger log = LoggerFactory.getLogger(ChatController.class);
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping("/sessions")
    public ResponseEntity<ChatSession> createSession(@RequestBody Map<String, String> request) {
        String projectId = request.get("projectId");
        String promptId = request.get("promptId");
        if (projectId == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(chatService.createSession(projectId, promptId));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<ChatSession>> getSessions(@RequestParam String projectId) {
        return ResponseEntity.ok(chatService.getSessions(projectId));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable String sessionId) {
        return ResponseEntity.ok(chatService.getMessages(sessionId));
    }

    @PutMapping("/sessions/{sessionId}")
    public ResponseEntity<ChatSession> updateSession(@PathVariable String sessionId, @RequestBody Map<String, String> request) {
        String title = request.get("title");
        if (title == null) return ResponseEntity.badRequest().build();
        try {
            return ResponseEntity.ok(chatService.updateSession(sessionId, title));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> deleteSession(@PathVariable String sessionId) {
        chatService.deleteSession(sessionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<ChatMessage> sendMessage(@PathVariable String sessionId, @RequestBody Map<String, String> request) {
        String content = request.get("content");
        if (content == null) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.ok(chatService.sendMessage(sessionId, content));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request in sendMessage: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Unexpected error in sendMessage", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping(value = "/sessions/{sessionId}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<String>> streamMessage(@PathVariable String sessionId, @RequestBody Map<String, String> request) {
        String content = request.get("content");
        if (content == null) {
            return Flux.error(new IllegalArgumentException("Content is required"));
        }
        return chatService.streamMessage(sessionId, content)
                .map(data -> ServerSentEvent.builder(data).build());
    }
}