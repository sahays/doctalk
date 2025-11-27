package com.sanjeets.DocTalk.model.dto;

public class DocumentSummary {
    private String name;
    private String contentType;
    private Long size;
    private String timeCreated;
    private String updated;

    public DocumentSummary() {}

    public DocumentSummary(String name, String contentType, Long size, String timeCreated, String updated) {
        this.name = name;
        this.contentType = contentType;
        this.size = size;
        this.timeCreated = timeCreated;
        this.updated = updated;
    }

    public static Builder builder() {
        return new Builder();
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Long getSize() { return size; }
    public void setSize(Long size) { this.size = size; }

    public String getTimeCreated() { return timeCreated; }
    public void setTimeCreated(String timeCreated) { this.timeCreated = timeCreated; }

    public String getUpdated() { return updated; }
    public void setUpdated(String updated) { this.updated = updated; }

    public static class Builder {
        private String name;
        private String contentType;
        private Long size;
        private String timeCreated;
        private String updated;

        public Builder name(String name) { this.name = name; return this; }
        public Builder contentType(String contentType) { this.contentType = contentType; return this; }
        public Builder size(Long size) { this.size = size; return this; }
        public Builder timeCreated(String timeCreated) { this.timeCreated = timeCreated; return this; }
        public Builder updated(String updated) { this.updated = updated; return this; }

        public DocumentSummary build() {
            return new DocumentSummary(name, contentType, size, timeCreated, updated);
        }
    }
}