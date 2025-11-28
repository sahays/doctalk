package com.sanjeets.DocTalk.service;

import com.sanjeets.DocTalk.model.entity.Prompt;
import com.sanjeets.DocTalk.repository.PromptRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class PromptService {

    private final PromptRepository promptRepository;

    public PromptService(PromptRepository promptRepository) {
        this.promptRepository = promptRepository;
    }

    public Prompt createPrompt(String name, String content) {
        String id = UUID.randomUUID().toString();
        Prompt prompt = new Prompt(id, name, content, Instant.now().toString());
        promptRepository.save(prompt);
        return prompt;
    }

    public List<Prompt> getAllPrompts() {
        return promptRepository.findAll();
    }

    public Prompt updatePrompt(String id, String name, String content) {
        Prompt prompt = new Prompt(id, name, content, Instant.now().toString());
        promptRepository.save(prompt);
        return prompt;
    }

    public void deletePrompt(String id) {
        promptRepository.delete(id);
    }
}
