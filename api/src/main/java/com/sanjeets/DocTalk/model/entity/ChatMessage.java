package com.sanjeets.DocTalk.model.entity;

import java.util.List;
import java.util.Map;

public class ChatMessage {
    private String id;
    private String sessionId;
    private MessageRole role;
    private String content;
    private List<Map<String, String>> citations; // List of {uri, title}
    private String createdAt;

    public ChatMessage() {}

    public ChatMessage(String id, String sessionId, MessageRole role, String content, String createdAt) {
        this.id = id;
        this.sessionId = sessionId;
        this.role = role;
        this.content = content;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public MessageRole getRole() { return role; }
    public void setRole(MessageRole role) { this.role = role; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public List<Map<String, String>> getCitations() { return citations; }
    public void setCitations(List<Map<String, String>> citations) { this.citations = citations; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
