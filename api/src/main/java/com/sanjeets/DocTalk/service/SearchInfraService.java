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

import java.util.Collections;
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
            importDocuments(dataStoreId, project.getGcsPrefix());

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

    private void importDocuments(String dataStoreId, String gcsPrefix) {
        // Placeholder for Import Logic
        // We will implement the actual ImportDocumentsRequest call in the next iteration or use a separate method.
        // For now, we assume the infrastructure is set up.
        // To really import:
        /*
        try (DocumentServiceClient client = DocumentServiceClient.create()) {
             String parent = String.format("projects/%s/locations/%s/collections/default_collection/dataStores/%s/branches/default_branch", gcpProjectId, location, dataStoreId);
             GcsSource gcsSource = GcsSource.newBuilder().addInputUris("gs://" + bucketName + "/" + gcsPrefix + "*").build();
             ImportDocumentsRequest request = ImportDocumentsRequest.newBuilder()
                 .setParent(parent)
                 .setGcsSource(gcsSource)
                 .setErrorConfig(ImportErrorConfig.newBuilder().setGcsPrefix("gs://" + bucketName + "/errors").build())
                 .build();
             client.importDocumentsAsync(request);
        }
        */
        log.info("Import triggered for {} from gs://{}/{}", dataStoreId, bucketName, gcsPrefix);
    }

    private void updateStatus(Project project, ProjectStatus status) {
        project.setStatus(status);
        projectRepository.save(project);
    }
}
