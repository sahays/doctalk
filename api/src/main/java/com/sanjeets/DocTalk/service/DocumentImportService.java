package com.sanjeets.DocTalk.service;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Storage;
import com.google.storagetransfer.v1.proto.TransferTypes;
import com.google.storagetransfer.v1.proto.TransferProto;
import com.google.storagetransfer.v1.proto.StorageTransferServiceClient;
import com.sanjeets.DocTalk.controller.dto.ImportRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;

@Service
public class DocumentImportService {

    private static final Logger log = LoggerFactory.getLogger(DocumentImportService.class);
    private final Storage storage;

    @Value("${doctalk.gcs.bucket-name}")
    private String destinationBucketName;

    @Value("${doctalk.gcp.project-id}")
    private String gcpProjectId;

    public DocumentImportService(Storage storage) {
        this.storage = storage;
    }

    @Async
    public void importDocuments(String projectId, ImportRequest request) {
        if ("GCS".equalsIgnoreCase(request.getType())) {
            importFromGcs(projectId, request);
        } else if ("S3".equalsIgnoreCase(request.getType())) {
            importFromS3(projectId, request);
        } else {
            throw new IllegalArgumentException("Unsupported import type: " + request.getType());
        }
    }

    private void importFromGcs(String projectId, ImportRequest request) {
        String sourceBucket = request.getSourceBucket();
        String sourcePrefix = request.getSourcePrefix() != null ? request.getSourcePrefix() : "";

        log.info("Starting GCS import from {}/{} to {}/{}", sourceBucket, sourcePrefix, destinationBucketName, projectId);

        Iterable<Blob> blobs = storage.list(sourceBucket, Storage.BlobListOption.prefix(sourcePrefix)).iterateAll();

        for (Blob blob : blobs) {
            if (blob.getName().endsWith("/")) continue; // Skip folders

            String newName = projectId + "/" + blob.getName(); // Simple flat copy or preserve structure?
            // If sourcePrefix is "folder/", and blob is "folder/file.txt", we might want "projectId/folder/file.txt" 
            // or strip the prefix. Let's just prepend projectId for now to keep it unique.
            
            // Actually, usually users expect the file name to be preserved relative to the import root.
            // But to avoid complexity, let's just copy the full path.
            
            BlobId sourceId = BlobId.of(sourceBucket, blob.getName());
            BlobId targetId = BlobId.of(destinationBucketName, newName);

            storage.copy(Storage.CopyRequest.newBuilder()
                    .setSource(sourceId)
                    .setTarget(targetId)
                    .build());
        }
        log.info("GCS import completed.");
    }

    private void importFromS3(String projectId, ImportRequest request) {
        log.info("Initiating S3 import via Storage Transfer Service");

        try (StorageTransferServiceClient client = StorageTransferServiceClient.create()) {
            
            String sinkPath = projectId + "/";

            TransferTypes.AwsAccessKey awsAccessKey = TransferTypes.AwsAccessKey.newBuilder()
                    .setAccessKeyId(request.getAccessKey())
                    .setSecretAccessKey(request.getSecretKey())
                    .build();

            TransferTypes.AwsS3Data source = TransferTypes.AwsS3Data.newBuilder()
                    .setBucketName(request.getSourceBucket())
                    .setPath(request.getSourcePrefix() != null ? request.getSourcePrefix() : "")
                    .setAwsAccessKey(awsAccessKey)
                    .build();

            TransferTypes.GcsData sink = TransferTypes.GcsData.newBuilder()
                    .setBucketName(destinationBucketName)
                    .setPath(sinkPath)
                    .build();

            TransferTypes.TransferJob transferJob = TransferTypes.TransferJob.newBuilder()
                    .setProjectId(gcpProjectId)
                    .setTransferSpec(TransferTypes.TransferSpec.newBuilder()
                            .setAwsS3DataSource(source)
                            .setGcsDataSink(sink)
                            .build())
                    .setStatus(TransferTypes.TransferJob.Status.ENABLED)
                    .setDescription("DocTalk Import from S3 for project " + projectId)
                    .setSchedule(TransferTypes.Schedule.newBuilder()
                            .setScheduleStartDate(
                                    com.google.type.Date.newBuilder()
                                            .setYear(LocalDate.now().getYear())
                                            .setMonth(LocalDate.now().getMonthValue())
                                            .setDay(LocalDate.now().getDayOfMonth()).build())
                            .setScheduleEndDate(
                                    com.google.type.Date.newBuilder()
                                            .setYear(LocalDate.now().getYear())
                                            .setMonth(LocalDate.now().getMonthValue())
                                            .setDay(LocalDate.now().getDayOfMonth()).build())
                            .setStartTimeOfDay(
                                    com.google.type.TimeOfDay.newBuilder()
                                            .setHours(LocalTime.now().getHour())
                                            .setMinutes(LocalTime.now().getMinute()).build())
                            .build())
                    .build();

            TransferTypes.TransferJob createdJob = client.createTransferJob(TransferProto.CreateTransferJobRequest.newBuilder()
                    .setTransferJob(transferJob)
                    .build());

            log.info("Created Storage Transfer Job: {}", createdJob.getName());

            // We could run it immediately using RunTransferJobRequest if needed,
            // but setting the schedule to "now" usually triggers it.
            client.runTransferJobAsync(TransferProto.RunTransferJobRequest.newBuilder()
                    .setJobName(createdJob.getName())
                    .setProjectId(gcpProjectId)
                    .build());

        } catch (IOException e) {
            log.error("Failed to create transfer job", e);
            throw new RuntimeException("Import failed", e);
        }
    }
}
