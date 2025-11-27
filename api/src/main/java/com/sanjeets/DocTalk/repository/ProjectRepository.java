package com.sanjeets.DocTalk.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.sanjeets.DocTalk.model.entity.Project;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class ProjectRepository {

    private static final Logger log = LoggerFactory.getLogger(ProjectRepository.class);
    private final Firestore firestore;
    private static final String COLLECTION_NAME = "projects";

    public ProjectRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public void save(Project project) {
        ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME).document(project.getId()).set(project);
        try {
            future.get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to save project", e);
            throw new RuntimeException("Database error", e);
        }
    }

    public Project findById(String id) {
        try {
            DocumentSnapshot document = firestore.collection(COLLECTION_NAME).document(id).get().get();
            if (document.exists()) {
                return document.toObject(Project.class);
            }
            return null;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to find project", e);
            throw new RuntimeException("Database error", e);
        }
    }

    public List<Project> findAll() {
        try {
            ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            List<Project> projects = new ArrayList<>();
            for (DocumentSnapshot document : documents) {
                projects.add(document.toObject(Project.class));
            }
            return projects;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to list projects", e);
            throw new RuntimeException("Database error", e);
        }
    }
}
