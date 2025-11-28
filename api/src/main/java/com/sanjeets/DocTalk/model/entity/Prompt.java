package com.sanjeets.DocTalk.model.entity;

public class Prompt {
    private String id;
    private String name;
    private String content;
    private String createdAt;

    public Prompt() {}

    public Prompt(String id, String name, String content, String createdAt) {
        this.id = id;
        this.name = name;
        this.content = content;
        this.createdAt = createdAt;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
