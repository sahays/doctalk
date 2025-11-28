package com.sanjeets.DocTalk.model.entity;

public class Project {
    private String id;
    private String name;
    private ProjectStatus status;
    private String gcsPrefix;
    private String dataStoreId;
    private String engineId;
    private String createdAt;
    private String latestImportOperation;
    private String importStatus; // IDLE, RUNNING, COMPLETED, FAILED
    private String lastIndexedAt;

    public Project() {}

    public Project(String id, String name, ProjectStatus status, String gcsPrefix, String dataStoreId, String engineId, String createdAt) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.gcsPrefix = gcsPrefix;
        this.dataStoreId = dataStoreId;
        this.engineId = engineId;
        this.createdAt = createdAt;
        this.importStatus = "IDLE";
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ProjectStatus getStatus() { return status; }
    public void setStatus(ProjectStatus status) { this.status = status; }

    public String getGcsPrefix() { return gcsPrefix; }
    public void setGcsPrefix(String gcsPrefix) { this.gcsPrefix = gcsPrefix; }

    public String getDataStoreId() { return dataStoreId; }
    public void setDataStoreId(String dataStoreId) { this.dataStoreId = dataStoreId; }

    public String getEngineId() { return engineId; }
    public void setEngineId(String engineId) { this.engineId = engineId; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getLatestImportOperation() { return latestImportOperation; }
    public void setLatestImportOperation(String latestImportOperation) { this.latestImportOperation = latestImportOperation; }

    public String getImportStatus() { return importStatus; }
    public void setImportStatus(String importStatus) { this.importStatus = importStatus; }

    public String getLastIndexedAt() { return lastIndexedAt; }
    public void setLastIndexedAt(String lastIndexedAt) { this.lastIndexedAt = lastIndexedAt; }
}
