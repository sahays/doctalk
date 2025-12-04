package com.sanjeets.DocTalk.controller.dto;

public class CreateProjectRequest {
    private String name;
    private String storageMode;    // "MANAGED" or "BYOB"
    private String bucketName;     // For BYOB mode
    private String bucketPrefix;   // For BYOB mode

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStorageMode() {
        return storageMode;
    }

    public void setStorageMode(String storageMode) {
        this.storageMode = storageMode;
    }

    public String getBucketName() {
        return bucketName;
    }

    public void setBucketName(String bucketName) {
        this.bucketName = bucketName;
    }

    public String getBucketPrefix() {
        return bucketPrefix;
    }

    public void setBucketPrefix(String bucketPrefix) {
        this.bucketPrefix = bucketPrefix;
    }
}
