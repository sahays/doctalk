package com.sanjeets.DocTalk.service;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.vertexai.VertexAI;
import com.google.cloud.vertexai.api.Candidate;
import com.google.cloud.vertexai.api.Content;
import com.google.cloud.vertexai.api.GenerateContentResponse;
import com.google.cloud.vertexai.api.GoogleSearchRetrieval;
import com.google.cloud.vertexai.api.GroundingChunk;
import com.google.cloud.vertexai.api.GroundingMetadata;
import com.google.cloud.vertexai.api.Retrieval;
import com.google.cloud.vertexai.api.Tool;
import com.google.cloud.vertexai.api.VertexAISearch;
import com.google.cloud.vertexai.generativeai.ContentMaker;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.google.cloud.vertexai.generativeai.ResponseHandler;
import com.google.cloud.vertexai.generativeai.ResponseStream;
import com.sanjeets.DocTalk.model.entity.ChatMessage;
import com.sanjeets.DocTalk.model.entity.ChatSession;
import com.sanjeets.DocTalk.model.entity.MessageRole;
import com.sanjeets.DocTalk.model.entity.Project;
import com.sanjeets.DocTalk.model.entity.Prompt;
import com.sanjeets.DocTalk.repository.ChatSessionRepository;
import com.sanjeets.DocTalk.repository.ProjectRepository;
import com.sanjeets.DocTalk.repository.PromptRepository;

import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final ChatSessionRepository chatSessionRepository;
    private final ProjectRepository projectRepository;
    private final PromptRepository promptRepository;
    private final ObjectMapper objectMapper;
    private final DocumentService documentService;

    @Value("${doctalk.gcp.project-id}")
    private String gcpProjectId;

    @Value("${doctalk.chat.location:us-central1}")
    private String vertexAiLocation;

    @Value("${doctalk.search.location:global}")
    private String searchLocation;

    @Value("${doctalk.chat.model:gemini-1.5-flash-001}")
    private String modelName;

    public ChatService(ChatSessionRepository chatSessionRepository, ProjectRepository projectRepository,
            PromptRepository promptRepository, ObjectMapper objectMapper, DocumentService documentService) {
        this.chatSessionRepository = chatSessionRepository;
        this.projectRepository = projectRepository;
        this.promptRepository = promptRepository;
        this.objectMapper = objectMapper;
        this.documentService = documentService;
    }

    public ChatSession createSession(String projectId, String promptId) {
        String title = java.time.format.DateTimeFormatter.ofPattern("MMM dd, HH:mm")
                .withZone(java.time.ZoneId.systemDefault())
                .format(Instant.now());

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
        List<ChatSession> sessions = chatSessionRepository.getSessionsByProject(projectId);
        sessions.sort((s1, s2) -> s2.getCreatedAt().compareTo(s1.getCreatedAt())); // Descending order
        return sessions;
    }

    public List<ChatMessage> getMessages(String sessionId) {
        List<ChatMessage> messages = chatSessionRepository.getMessages(sessionId);
        // Enrich with signed URLs for display
        for (ChatMessage msg : messages) {
            if (msg.getCitations() != null) {
                for (Map<String, String> citation : msg.getCitations()) {
                    String originalUri = citation.get("uri");
                    citation.put("uri", documentService.generateReadSignedUrl(originalUri));
                }
            }
        }
        return messages;
    }

    public ChatSession updateSession(String sessionId, String newTitle) {
        ChatSession session = chatSessionRepository.getSession(sessionId);
        if (session == null) throw new IllegalArgumentException("Session not found");
        session.setTitle(newTitle);
        chatSessionRepository.saveSession(session);
        return session;
    }

    public void deleteSession(String sessionId) {
        chatSessionRepository.deleteSession(sessionId);
    }

    public ChatMessage sendMessage(String sessionId, String userMessageText) {
        log.info("sendMessage called for sessionId: {}", sessionId);

        ChatSession session = chatSessionRepository.getSession(sessionId);

        if (session == null)
            throw new IllegalArgumentException("Session not found");

        Project project = projectRepository.findById(session.getProjectId());
        if (project == null)
            throw new IllegalArgumentException("Project not found");

        log.info("Using GCP Project: {}, VertexAI Location: {}, Model: {}, DataStore: {}",
                gcpProjectId, vertexAiLocation, modelName, project.getDataStoreId());

        // 1. Save User Message
        ChatMessage userMessage = new ChatMessage(
                UUID.randomUUID().toString(),
                sessionId,
                MessageRole.USER,
                userMessageText,
                Instant.now().toString());
        chatSessionRepository.saveMessage(userMessage);

        // 2. Prepare Gemini Request
        try (VertexAI vertexAI = new VertexAI(gcpProjectId, vertexAiLocation)) {

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
                String dataStoreResource = String.format(
                        "projects/%s/locations/%s/collections/default_collection/dataStores/%s",
                        gcpProjectId, searchLocation, project.getDataStoreId());

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
            List<ChatMessage> historyMessages = chatSessionRepository.getMessages(sessionId);
            com.google.cloud.vertexai.generativeai.ChatSession chat = model.startChat();

            // Replay history (excluding the one we just saved)
            List<Content> historyContent = new ArrayList<>();
            for (ChatMessage msg : historyMessages) {
                if (msg.getId().equals(userMessage.getId()))
                    continue;

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
                    Instant.now().toString());
            modelMessage.setCitations(citations);
            chatSessionRepository.saveMessage(modelMessage);

            return modelMessage;

        } catch (IOException e) {
            log.error("Gemini interaction failed", e);
            throw new RuntimeException("AI Error", e);
        }
    }

    public Flux<String> streamMessage(String sessionId, String userMessageText) {
        log.info("streamMessage called for sessionId: {}", sessionId);

        ChatSession session = chatSessionRepository.getSession(sessionId);
        if (session == null)
            throw new IllegalArgumentException("Session not found");

        Project project = projectRepository.findById(session.getProjectId());
        if (project == null)
            throw new IllegalArgumentException("Project not found");

        // 1. Save User Message
        ChatMessage userMessage = new ChatMessage(
                UUID.randomUUID().toString(),
                sessionId,
                MessageRole.USER,
                userMessageText,
                Instant.now().toString());
        chatSessionRepository.saveMessage(userMessage);

        // Determine initial status
        String initialStatus;
        try {
            Map<String, String> statusMap = new HashMap<>();
            if (project.getDataStoreId() != null && !project.getDataStoreId().isEmpty()) {
                statusMap.put("status", "Searching project documents...");
            } else {
                statusMap.put("status", "Thinking...");
            }
            initialStatus = objectMapper.writeValueAsString(statusMap);
        } catch (Exception e) {
            initialStatus = "{\"status\": \"Processing...\"}";
        }

        return Flux.concat(
            Flux.just(initialStatus),
            Flux.using(
                () -> new VertexAI(gcpProjectId, vertexAiLocation),
                vertexAI -> {
                    try {
                        // System Instruction
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
                            String dataStoreResource = String.format(
                                    "projects/%s/locations/%s/collections/default_collection/dataStores/%s",
                                    gcpProjectId, searchLocation, project.getDataStoreId());
                            Retrieval retrieval = Retrieval.newBuilder()
                                    .setVertexAiSearch(VertexAISearch.newBuilder().setDatastore(dataStoreResource).build())
                                    .build();
                            groundingTool = Tool.newBuilder().setRetrieval(retrieval).build();
                        } else {
                            groundingTool = Tool.newBuilder()
                                    .setGoogleSearchRetrieval(GoogleSearchRetrieval.newBuilder().build())
                                    .build();
                        }

                        GenerativeModel.Builder builder = new GenerativeModel.Builder()
                                .setModelName(modelName)
                                .setVertexAi(vertexAI)
                                .setTools(Collections.singletonList(groundingTool));

                        if (systemInstruction != null) {
                            builder.setSystemInstruction(systemInstruction);
                        }

                        GenerativeModel model = builder.build();

                        // History
                        List<ChatMessage> historyMessages = chatSessionRepository.getMessages(sessionId);
                        com.google.cloud.vertexai.generativeai.ChatSession chat = model.startChat();
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

                        // Stream
                        ResponseStream<GenerateContentResponse> stream = chat.sendMessageStream(userMessageText);

                        // State for aggregation
                        StringBuilder fullResponse = new StringBuilder();
                        List<Map<String, String>> allCitations = new ArrayList<>();
                        Set<String> uniqueUris = new HashSet<>();

                        return Flux.fromIterable(stream)
                                .map(resp -> {
                                    String text = ResponseHandler.getText(resp);

                                    // Citations
                                    if (resp.getCandidatesCount() > 0) {
                                        Candidate candidate = resp.getCandidates(0);
                                        if (candidate.hasGroundingMetadata()) {
                                            GroundingMetadata metadata = candidate.getGroundingMetadata();
                                            for (GroundingChunk chunk : metadata.getGroundingChunksList()) {
                                                if (chunk.hasRetrievedContext()) {
                                                    GroundingChunk.RetrievedContext context = chunk.getRetrievedContext();
                                                    String uri = context.getUri().trim();
                                                    if (uniqueUris.add(uri)) {
                                                        Map<String, String> citation = new HashMap<>();
                                                        citation.put("uri", uri);
                                                        citation.put("title", context.getTitle());
                                                        allCitations.add(citation);
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    if (text != null) {
                                        fullResponse.append(text);
                                        try {
                                            Map<String, String> chunkMap = new HashMap<>();
                                            chunkMap.put("text", text);
                                            return objectMapper.writeValueAsString(chunkMap);
                                        } catch (Exception e) { return ""; }
                                    }
                                    return "";
                                })
                                .filter(s -> !s.isEmpty())
                                .doOnComplete(() -> {
                                    log.info("Stream finished. Citations: {}", allCitations.size());
                                    // Save to DB
                                    ChatMessage modelMessage = new ChatMessage(
                                            UUID.randomUUID().toString(),
                                            sessionId,
                                            MessageRole.MODEL,
                                            fullResponse.toString(),
                                            Instant.now().toString());
                                    modelMessage.setCitations(allCitations);
                                    chatSessionRepository.saveMessage(modelMessage);
                                })
                                .concatWith(Flux.defer(() -> {
                                    if (!allCitations.isEmpty()) {
                                        try {
                                            List<Map<String, String>> displayCitations = new ArrayList<>();
                                            for (Map<String, String> cite : allCitations) {
                                                Map<String, String> displayCite = new HashMap<>(cite);
                                                displayCite.put("uri", documentService.generateReadSignedUrl(cite.get("uri")));
                                                displayCitations.add(displayCite);
                                            }
                                            Map<String, Object> finalChunk = new HashMap<>();
                                            finalChunk.put("citations", displayCitations);
                                            return Flux.just(objectMapper.writeValueAsString(finalChunk));
                                        } catch (Exception e) { log.error("Citation JSON Error", e); }
                                    }
                                    return Flux.empty();
                                }));

                    } catch (Exception e) {
                        return Flux.error(e);
                    }
                },
                VertexAI::close
            )
        ).subscribeOn(Schedulers.boundedElastic());
    }
}
