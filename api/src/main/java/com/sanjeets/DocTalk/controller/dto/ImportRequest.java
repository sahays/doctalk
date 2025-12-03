package com.sanjeets.DocTalk.controller.dto;

public class ImportRequest {
    private String type; // "GCS" or "S3"
    private String sourceBucket;
    private String sourcePrefix; // Optional
    private String accessKey; // Only for S3
    private String secretKey; // Only for S3

    // Getters and Setters
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getSourceBucket() { return sourceBucket; }
    public void setSourceBucket(String sourceBucket) { this.sourceBucket = sourceBucket; }

    public String getSourcePrefix() { return sourcePrefix; }
    public void setSourcePrefix(String sourcePrefix) { this.sourcePrefix = sourcePrefix; }

    public String getAccessKey() { return accessKey; }
    public void setAccessKey(String accessKey) { this.accessKey = accessKey; }

    public String getSecretKey() { return secretKey; }
    public void setSecretKey(String secretKey) { this.secretKey = secretKey; }
}
