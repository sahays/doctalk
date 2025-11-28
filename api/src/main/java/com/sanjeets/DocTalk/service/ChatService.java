package com.sanjeets.DocTalk.service;

import com.google.cloud.vertexai.VertexAI;
import com.google.cloud.vertexai.api.*;
import com.google.cloud.vertexai.generativeai.ContentMaker;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.google.cloud.vertexai.generativeai.ResponseHandler;
import com.google.common.collect.ImmutableList;
import com.sanjeets.DocTalk.model.entity.*;
import com.sanjeets.DocTalk.repository.ChatSessionRepository;
import com.sanjeets.DocTalk.repository.ProjectRepository;
import com.sanjeets.DocTalk.repository.PromptRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.util.*;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final ChatSessionRepository chatSessionRepository;
    private final ProjectRepository projectRepository;
    private final PromptRepository promptRepository;

    @Value("${doctalk.gcp.project-id}")
    private String gcpProjectId;

    @Value("${doctalk.search.location:global}")
    private String location;

    @Value("${doctalk.chat.model:gemini-1.5-flash-001}")
    private String modelName;

    public ChatService(ChatSessionRepository chatSessionRepository, ProjectRepository projectRepository, PromptRepository promptRepository) {
        this.chatSessionRepository = chatSessionRepository;
        this.projectRepository = projectRepository;
        this.promptRepository = promptRepository;
    }

    public ChatSession createSession(String projectId, String promptId) {
        // Fetch prompt name to set as initial title (or use "New Chat")
        String title = "New Chat";
        if (promptId != null) {
            // Optional: Fetch prompt title
        }

        ChatSession session = new ChatSession(
                UUID.randomUUID().toString(),
                projectId,
                promptId,
                title,
                Instant.now().toString()
        );
        chatSessionRepository.saveSession(session);
        return session;
    }

    public List<ChatSession> getSessions(String projectId) {
        return chatSessionRepository.getSessionsByProject(projectId);
    }

    public List<ChatMessage> getMessages(String sessionId) {
        return chatSessionRepository.getMessages(sessionId);
    }

    public ChatMessage sendMessage(String sessionId, String userMessageText) {
        ChatSession session = chatSessionRepository.getSession(sessionId);
        if (session == null) throw new IllegalArgumentException("Session not found");

        Project project = projectRepository.findById(session.getProjectId());
        if (project == null) throw new IllegalArgumentException("Project not found");

        // 1. Save User Message
        ChatMessage userMessage = new ChatMessage(
                UUID.randomUUID().toString(),
                sessionId,
                MessageRole.USER,
                userMessageText,
                Instant.now().toString()
        );
        chatSessionRepository.saveMessage(userMessage);

        // 2. Prepare Gemini Request
        try (VertexAI vertexAI = new VertexAI(gcpProjectId, location)) {
            
            // System Instruction (Persona)
            Content systemInstruction = null;
            if (session.getPromptId() != null) {
                 Prompt prompt = promptRepository.findById(session.getPromptId());
                 if (prompt != null) {
                     systemInstruction = ContentMaker.fromMultiModalData(prompt.getContent());
                 }
            }

            // Grounding Tool
            Tool groundingTool;
            if (project.getDataStoreId() != null) {
                String dataStoreResource = String.format("projects/%s/locations/%s/collections/default_collection/dataStores/%s", 
                        gcpProjectId, location, project.getDataStoreId());
                
                Retrieval retrieval = Retrieval.newBuilder()
                        .setVertexAiSearch(VertexAISearch.newBuilder().setDatastore(dataStoreResource).build())
                        .build();
                
                groundingTool = Tool.newBuilder()
                        .setRetrieval(retrieval)
                        .build();
            } else {
                // Fallback
                 groundingTool = Tool.newBuilder()
                    .setGoogleSearchRetrieval(GoogleSearchRetrieval.newBuilder().build())
                    .build();
            }
            
            // Initialize Model with Config
            GenerativeModel.Builder builder = new GenerativeModel.Builder()
                .setModelName(modelName)
                .setVertexAi(vertexAI)
                .setTools(Collections.singletonList(groundingTool));

            if (systemInstruction != null) {
                builder.setSystemInstruction(systemInstruction);
            }

            GenerativeModel model = builder.build();
            
            // Generate Content with History
            // 1. Load history
            List<ChatMessage> historyMessages = chatSessionRepository.getMessages(sessionId);
            com.google.cloud.vertexai.generativeai.ChatSession chat = model.startChat();
            
            // Replay history (excluding the one we just saved)
            List<Content> historyContent = new ArrayList<>();
            for (ChatMessage msg : historyMessages) {
                if (msg.getId().equals(userMessage.getId())) continue;

                if (msg.getRole() == MessageRole.USER) {
                    historyContent.add(ContentMaker.fromMultiModalData(msg.getContent()));
                } else {
                    historyContent.add(ContentMaker.forRole("model").fromString(msg.getContent()));
                }
            }
            chat.setHistory(historyContent);

            GenerateContentResponse response = chat.sendMessage(userMessageText);
            String responseText = ResponseHandler.getText(response);
            
            // Extract Citations
            List<Map<String, String>> citations = new ArrayList<>();
            if (response.getCandidatesCount() > 0) {
                Candidate candidate = response.getCandidates(0);
                if (candidate.hasGroundingMetadata()) {
                    GroundingMetadata metadata = candidate.getGroundingMetadata();
                    for (GroundingChunk chunk : metadata.getGroundingChunksList()) {
                        if (chunk.hasRetrievedContext()) {
                             GroundingChunk.RetrievedContext context = chunk.getRetrievedContext();
                             Map<String, String> citation = new HashMap<>();
                             citation.put("uri", context.getUri());
                             citation.put("title", context.getTitle());
                             citations.add(citation);
                        }
                    }
                }
            }

            // 3. Save Model Response
            ChatMessage modelMessage = new ChatMessage(
                    UUID.randomUUID().toString(),
                    sessionId,
                    MessageRole.MODEL,
                    responseText,
                    Instant.now().toString()
            );
            modelMessage.setCitations(citations);
            chatSessionRepository.saveMessage(modelMessage);

            return modelMessage;

        } catch (IOException e) {
            log.error("Gemini interaction failed", e);
            throw new RuntimeException("AI Error", e);
        }
    }
}