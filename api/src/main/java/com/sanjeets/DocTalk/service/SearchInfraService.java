package com.sanjeets.DocTalk.service;

import com.google.api.gax.longrunning.OperationFuture;
import com.google.cloud.discoveryengine.v1.*;
import com.google.protobuf.Empty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.concurrent.ExecutionException;

@Service
public class SearchInfraService {

    private static final Logger log = LoggerFactory.getLogger(SearchInfraService.class);

    @Value("${doctalk.gcp.project-id}")
    private String projectId;

    @Value("${doctalk.search.location:global}")
    private String location;

    @Value("${doctalk.search.data-store-id:doctalk-knowledge-base}")
    private String dataStoreId;

    public SearchInfraService() {}

    public void provisionDataStore() {
        try (DataStoreServiceClient dataStoreServiceClient = DataStoreServiceClient.create()) {
            String parent = String.format("projects/%s/locations/%s/collections/default_collection", projectId, location);
            
            // Check if exists
            try {
                DataStore existing = dataStoreServiceClient.getDataStore(
                        String.format("%s/dataStores/%s", parent, dataStoreId));
                log.info("Data Store {} already exists.", existing.getName());
                return;
            } catch (Exception e) {
                log.info("Data Store not found, creating new one...");
            }

            // Create Data Store for Unstructured Data (Generic Search)
            DataStore dataStore = DataStore.newBuilder()
                    .setDisplayName("DocTalk Knowledge Base")
                    .setIndustryVertical(IndustryVertical.GENERIC)
                    .addSolutionTypes(SolutionType.SOLUTION_TYPE_SEARCH)
                    .setContentConfig(DataStore.ContentConfig.CONTENT_REQUIRED) // Unstructured with content
                    .build();

            CreateDataStoreRequest request = CreateDataStoreRequest.newBuilder()
                    .setParent(parent)
                    .setDataStore(dataStore)
                    .setDataStoreId(dataStoreId)
                    .build();

            OperationFuture<DataStore, CreateDataStoreMetadata> operation = dataStoreServiceClient.createDataStoreAsync(request);
            DataStore created = operation.get();
            log.info("Successfully created Data Store: {}", created.getName());

        } catch (IOException | InterruptedException | ExecutionException e) {
            log.error("Failed to provision Data Store", e);
            throw new RuntimeException("Search Infra Provisioning Failed", e);
        }
    }

    public void createSearchApp() {
        try (EngineServiceClient engineServiceClient = EngineServiceClient.create()) {
            String parent = String.format("projects/%s/locations/%s/collections/default_collection", projectId, location);
            String engineId = "doctalk-search-app";

            // Check if Engine exists
            try {
                Engine existing = engineServiceClient.getEngine(
                    String.format("%s/engines/%s", parent, engineId));
                log.info("Search Engine {} already exists.", existing.getName());
                return;
            } catch (Exception e) {
                log.info("Search Engine not found, creating new one...");
            }

            Engine engine = Engine.newBuilder()
                    .setDisplayName("DocTalk Search App")
                    .setSolutionType(SolutionType.SOLUTION_TYPE_SEARCH)
                    .addDataStoreIds(dataStoreId)
                    .build();

            CreateEngineRequest request = CreateEngineRequest.newBuilder()
                    .setParent(parent)
                    .setEngine(engine)
                    .setEngineId(engineId)
                    .build();

            OperationFuture<Engine, CreateEngineMetadata> operation = engineServiceClient.createEngineAsync(request);
            Engine created = operation.get();
            log.info("Successfully created Search Engine: {}", created.getName());

        } catch (IOException | InterruptedException | ExecutionException e) {
            log.error("Failed to create Search Engine", e);
            throw new RuntimeException("Search Engine Creation Failed", e);
        }
    }
}
