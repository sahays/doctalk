package com.sanjeets.DocTalk.controller;

import com.sanjeets.DocTalk.model.entity.Prompt;
import com.sanjeets.DocTalk.service.PromptService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prompts")
@CrossOrigin(origins = "http://localhost:3000")
public class PromptController {

    private final PromptService promptService;

    public PromptController(PromptService promptService) {
        this.promptService = promptService;
    }

    @PostMapping
    public ResponseEntity<Prompt> createPrompt(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String content = request.get("content");
        if (name == null || content == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(promptService.createPrompt(name, content));
    }

    @GetMapping
    public ResponseEntity<List<Prompt>> listPrompts() {
        return ResponseEntity.ok(promptService.getAllPrompts());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Prompt> updatePrompt(@PathVariable String id, @RequestBody Map<String, String> request) {
        String name = request.get("name");
        String content = request.get("content");
        if (name == null || content == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(promptService.updatePrompt(id, name, content));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrompt(@PathVariable String id) {
        promptService.deletePrompt(id);
        return ResponseEntity.noContent().build();
    }
}
