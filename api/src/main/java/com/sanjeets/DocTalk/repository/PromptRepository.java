package com.sanjeets.DocTalk.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.sanjeets.DocTalk.model.entity.Prompt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class PromptRepository {

    private static final Logger log = LoggerFactory.getLogger(PromptRepository.class);
    private final Firestore firestore;
    private static final String COLLECTION_NAME = "doctalk-prompts";

    public PromptRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    public void save(Prompt prompt) {
        ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME).document(prompt.getId()).set(prompt);
        try {
            future.get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to save prompt", e);
            throw new RuntimeException("Database error", e);
        }
    }

    public void delete(String id) {
        ApiFuture<WriteResult> future = firestore.collection(COLLECTION_NAME).document(id).delete();
        try {
            future.get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to delete prompt", e);
            throw new RuntimeException("Database error", e);
        }
    }

    public List<Prompt> findAll() {
        try {
            ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            List<Prompt> prompts = new ArrayList<>();
            for (DocumentSnapshot document : documents) {
                Prompt prompt = document.toObject(Prompt.class);
                if (prompt != null) {
                    prompt.setId(document.getId());
                    prompts.add(prompt);
                }
            }
            return prompts;
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to list prompts", e);
            throw new RuntimeException("Database error", e);
        }
    }
}
