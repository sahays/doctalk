package com.sanjeets.DocTalk.service;

import com.google.api.gax.longrunning.OperationFuture;
import com.google.cloud.discoveryengine.v1.*;
import com.sanjeets.DocTalk.model.entity.Project;
import com.sanjeets.DocTalk.model.entity.ProjectStatus;
import com.sanjeets.DocTalk.repository.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.sanjeets.DocTalk.model.dto.DocumentSummary;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class SearchInfraService {

    private static final Logger log = LoggerFactory.getLogger(SearchInfraService.class);

    @Value("${doctalk.gcp.project-id}")
    private String gcpProjectId;

    @Value("${doctalk.search.location:global}")
    private String location;

    @Value("${doctalk.gcs.bucket-name}")
    private String bucketName;

    private final ProjectRepository projectRepository;

    public SearchInfraService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Async
    public void provisionProject(String projectId) {
        Project project = projectRepository.findById(projectId);
        if (project == null) {
            log.error("Project not found: {}", projectId);
            return;
        }

        log.info("Starting provisioning for Project: {}", project.getName());
        updateStatus(project, ProjectStatus.PROVISIONING);

        try {
            // 1. Create Data Store
            // Format: ds-<short-uuid> (Data Store IDs must be 1-63 chars, lowercase, no spaces)
            String dataStoreId = "ds-" + projectId; 
            createDataStore(dataStoreId, project.getName());
            project.setDataStoreId(dataStoreId);

            // 2. Create Engine (App)
            String engineId = "app-" + projectId;
            createEngine(engineId, dataStoreId, project.getName());
            project.setEngineId(engineId);

            // 3. Import Documents (Initial Sync)
            // Note: This triggers a long-running import job.
            // Ideally, we should wait or track this separately, but for MVP we assume readiness after Engine creation.
            importDocuments(projectId, dataStoreId, project.getGcsPrefix());
            project.setLastIndexedAt(Instant.now().toString());

            // 4. Complete
            updateStatus(project, ProjectStatus.READY);
            log.info("Provisioning complete for Project: {}", project.getName());

        } catch (Exception e) {
            log.error("Provisioning failed for Project: " + project.getName(), e);
            updateStatus(project, ProjectStatus.FAILED);
        }
    }

    private void createDataStore(String dataStoreId, String projectName) throws Exception {
        try (DataStoreServiceClient client = DataStoreServiceClient.create()) {
            String parent = String.format("projects/%s/locations/%s/collections/default_collection", gcpProjectId, location);
            
            try {
                client.getDataStore(String.format("%s/dataStores/%s", parent, dataStoreId));
                log.info("Data Store {} already exists.", dataStoreId);
                return;
            } catch (Exception ignored) {}

            DataStore dataStore = DataStore.newBuilder()
                    .setDisplayName("DocTalk DS: " + projectName)
                    .setIndustryVertical(IndustryVertical.GENERIC)
                    .addSolutionTypes(SolutionType.SOLUTION_TYPE_SEARCH)
                    .setContentConfig(DataStore.ContentConfig.CONTENT_REQUIRED)
                    .build();

            CreateDataStoreRequest request = CreateDataStoreRequest.newBuilder()
                    .setParent(parent)
                    .setDataStore(dataStore)
                    .setDataStoreId(dataStoreId)
                    .build();

            OperationFuture<DataStore, CreateDataStoreMetadata> operation = client.createDataStoreAsync(request);
            operation.get();
            log.info("Created Data Store: {}", dataStoreId);
        }
    }

    private void createEngine(String engineId, String dataStoreId, String projectName) throws Exception {
        try (EngineServiceClient client = EngineServiceClient.create()) {
            String parent = String.format("projects/%s/locations/%s/collections/default_collection", gcpProjectId, location);

            try {
                client.getEngine(String.format("%s/engines/%s", parent, engineId));
                log.info("Engine {} already exists.", engineId);
                return;
            } catch (Exception ignored) {}

            Engine engine = Engine.newBuilder()
                    .setDisplayName("DocTalk App: " + projectName)
                    .setSolutionType(SolutionType.SOLUTION_TYPE_SEARCH)
                    .addDataStoreIds(dataStoreId)
                    .build();

            CreateEngineRequest request = CreateEngineRequest.newBuilder()
                    .setParent(parent)
                    .setEngine(engine)
                    .setEngineId(engineId)
                    .build();

            OperationFuture<Engine, CreateEngineMetadata> operation = client.createEngineAsync(request);
            operation.get();
            log.info("Created Engine: {}", engineId);
        }
    }

    public String importDocuments(String projectId, String dataStoreId, String gcsPrefix) {
        try (DocumentServiceClient client = DocumentServiceClient.create()) {
             String parent = String.format("projects/%s/locations/%s/collections/default_collection/dataStores/%s/branches/default_branch", gcpProjectId, location, dataStoreId);
             
             // GCS URI: gs://bucket/prefix/*
             String gcsUri = String.format("gs://%s/%s*", bucketName, gcsPrefix);
             
             GcsSource gcsSource = GcsSource.newBuilder()
                     .addInputUris(gcsUri)
                     .setDataSchema("content")
                     .build();
             
             ImportDocumentsRequest request = ImportDocumentsRequest.newBuilder()
                 .setParent(parent)
                 .setGcsSource(gcsSource)
                 .setReconciliationMode(ImportDocumentsRequest.ReconciliationMode.INCREMENTAL)
                 .build();
             
             OperationFuture<ImportDocumentsResponse, ImportDocumentsMetadata> operation = client.importDocumentsAsync(request);
             String opName = operation.getName();
             log.info("Import operation initiated: {}", opName);

             return opName;
        } catch (IOException | InterruptedException | ExecutionException e) {
            log.error("Failed to trigger import for DataStore " + dataStoreId, e);
            throw new RuntimeException("Import Failed", e);
        }
    }

    public static class ImportStatusResult {
        public String status;
        public String completionTime; // ISO Instant

        public ImportStatusResult(String status, String completionTime) {
            this.status = status;
            this.completionTime = completionTime;
        }
    }

    public ImportStatusResult getImportOperationStatus(String operationName) {
        try (DocumentServiceClient client = DocumentServiceClient.create()) {
            com.google.longrunning.Operation operation = client.getOperationsClient().getOperation(operationName);
            
            if (!operation.getDone()) {
                return new ImportStatusResult("RUNNING", null);
            }

            if (operation.hasError()) {
                log.error("Import operation failed: {}", operation.getError().getMessage());
                return new ImportStatusResult("FAILED", null);
            }

            // Extract completion time from metadata
            String completionTime = Instant.now().toString();
            try {
                if (operation.hasMetadata()) {
                    ImportDocumentsMetadata metadata = operation.getMetadata().unpack(ImportDocumentsMetadata.class);
                    if (metadata.hasUpdateTime()) {
                        long seconds = metadata.getUpdateTime().getSeconds();
                        int nanos = metadata.getUpdateTime().getNanos();
                        completionTime = Instant.ofEpochSecond(seconds, nanos).toString();
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to unpack metadata for operation {}, using current time", operationName, e);
            }

            return new ImportStatusResult("COMPLETED", completionTime);
        } catch (Exception e) {
            log.warn("Failed to check operation {}", operationName, e);
            // If we can't check, assume RUNNING to be safe.
            return new ImportStatusResult("RUNNING", null); 
        }
    }

    public long getDocumentCount(String projectId) {
        Project project = projectRepository.findById(projectId);
        if (project == null || project.getDataStoreId() == null) return 0;

        try (DocumentServiceClient client = DocumentServiceClient.create()) {
            String parent = String.format("projects/%s/locations/%s/collections/default_collection/dataStores/%s/branches/default_branch", gcpProjectId, location, project.getDataStoreId());
            
            // List documents and count
            int count = 0;
            for (Document doc : client.listDocuments(parent).iterateAll()) {
                count++;
            }
            return count;
        } catch (Exception e) {
            log.warn("Failed to count documents for project {} (might be empty/initializing)", projectId, e);
            return 0;
        }
    }

    public List<DocumentSummary> listIndexedDocuments(String projectId) {
        Project project = projectRepository.findById(projectId);
        if (project == null || project.getDataStoreId() == null) return Collections.emptyList();

        List<DocumentSummary> summaries = new ArrayList<>();
        try (DocumentServiceClient client = DocumentServiceClient.create()) {
            String parent = String.format("projects/%s/locations/%s/collections/default_collection/dataStores/%s/branches/default_branch", gcpProjectId, location, project.getDataStoreId());
            
            for (Document doc : client.listDocuments(parent).iterateAll()) {
                summaries.add(DocumentSummary.builder()
                        .name(doc.getId())
                        .contentType("Indexed Document")
                        .size(0L)
                        .timeCreated(doc.getName()) 
                        .updated("Indexed")
                        .build());
            }
        } catch (Exception e) {
            log.error("Failed to list indexed documents", e);
        }
        return summaries;
    }

    private void updateStatus(Project project, ProjectStatus status) {
        project.setStatus(status);
        projectRepository.save(project);
    }
}
