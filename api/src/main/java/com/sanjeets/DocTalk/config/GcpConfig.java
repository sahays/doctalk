package com.sanjeets.DocTalk.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.FirestoreOptions;
import com.google.cloud.storage.Storage;
import com.google.cloud.storage.StorageOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class GcpConfig {

    @Value("${doctalk.gcp.project-id}")
    private String projectId;

    @Bean
    public GoogleCredentials googleCredentials() throws IOException {
        return GoogleCredentials.getApplicationDefault();
    }

    @Bean
    public Firestore firestore(GoogleCredentials credentials) {
        FirestoreOptions firestoreOptions =
            FirestoreOptions.getDefaultInstance().toBuilder()
                .setProjectId(projectId)
                .setCredentials(credentials)
                .build();
        return firestoreOptions.getService();
    }

    @Bean
    public Storage storage(GoogleCredentials credentials) {
        return StorageOptions.newBuilder()
                .setProjectId(projectId)
                .setCredentials(credentials)
                .build()
                .getService();
    }
}
