package com.sanjeets.DocTalk.model.entity;

public class ChatSession {
    private String id;
    private String projectId;
    private String promptId; // The persona used for this session
    private String title;
    private String createdAt;

    public ChatSession() {}

    public ChatSession(String id, String projectId, String promptId, String title, String createdAt) {
        this.id = id;
        this.projectId = projectId;
        this.promptId = promptId;
        this.title = title;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getProjectId() { return projectId; }
    public void setProjectId(String projectId) { this.projectId = projectId; }

    public String getPromptId() { return promptId; }
    public void setPromptId(String promptId) { this.promptId = promptId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
