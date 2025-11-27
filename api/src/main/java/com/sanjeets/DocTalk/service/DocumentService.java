package com.sanjeets.DocTalk.service;

import com.google.cloud.storage.Blob;
import com.google.cloud.storage.BlobInfo;
import com.google.cloud.storage.HttpMethod;
import com.google.cloud.storage.Storage;
import com.sanjeets.DocTalk.model.dto.DocumentSummary;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.StreamSupport;

@Service
public class DocumentService {

    private final Storage storage;

    @Value("${doctalk.gcs.bucket-name}")
    private String bucketName;

    public DocumentService(Storage storage) {
        this.storage = storage;
    }

    public URL generateUploadSignedUrl(String projectId, String fileName, String contentType) {
        String objectName = projectId + "/" + fileName;
        BlobInfo blobInfo = BlobInfo.newBuilder(bucketName, objectName)
                .setContentType(contentType)
                .build();

        Map<String, String> extensionHeaders = new HashMap<>();
        extensionHeaders.put("Content-Type", contentType);

        return storage.signUrl(
                blobInfo,
                15, // URL valid for 15 minutes
                TimeUnit.MINUTES,
                Storage.SignUrlOption.httpMethod(HttpMethod.PUT),
                Storage.SignUrlOption.withExtHeaders(extensionHeaders),
                Storage.SignUrlOption.withV4Signature()
        );
    }

    public List<DocumentSummary> listDocuments(String projectId) {
        var bucket = storage.get(bucketName);
        if (bucket == null) {
            throw new RuntimeException("GCS Bucket '" + bucketName + "' not found. Please verify configuration.");
        }
        
        Iterable<Blob> blobs = bucket.list(Storage.BlobListOption.prefix(projectId + "/")).iterateAll();

        return StreamSupport.stream(blobs.spliterator(), false)
                .filter(blob -> !blob.getName().endsWith("/")) // Exclude the folder itself if returned
                .map(blob -> DocumentSummary.builder()
                        .name(blob.getName().substring(projectId.length() + 1)) // Strip prefix from name for display
                        .contentType(blob.getContentType())
                        .size(blob.getSize())
                        .timeCreated(blob.getCreateTimeOffsetDateTime().toString())
                        .updated(blob.getUpdateTimeOffsetDateTime().toString())
                        .build())
                .toList();
    }
}
