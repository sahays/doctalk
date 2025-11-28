package com.sanjeets.DocTalk.repository;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.sanjeets.DocTalk.model.entity.ChatMessage;
import com.sanjeets.DocTalk.model.entity.ChatSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Repository
public class ChatSessionRepository {

    private static final Logger log = LoggerFactory.getLogger(ChatSessionRepository.class);
    private final Firestore firestore;
    private static final String SESSIONS_COLLECTION = "doctalk-chat-sessions";
    private static final String MESSAGES_COLLECTION = "messages";

    public ChatSessionRepository(Firestore firestore) {
        this.firestore = firestore;
    }

    // --- Sessions ---

    public void saveSession(ChatSession session) {
        try {
            firestore.collection(SESSIONS_COLLECTION).document(session.getId()).set(session).get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to save session", e);
            throw new RuntimeException(e);
        }
    }

    public ChatSession getSession(String id) {
        try {
            DocumentSnapshot doc = firestore.collection(SESSIONS_COLLECTION).document(id).get().get();
            if (doc.exists()) {
                return doc.toObject(ChatSession.class);
            }
            return null;
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException(e);
        }
    }

    public List<ChatSession> getSessionsByProject(String projectId) {
        try {
            QuerySnapshot query = firestore.collection(SESSIONS_COLLECTION)
                    .whereEqualTo("projectId", projectId)
                    .orderBy("createdAt", Query.Direction.DESCENDING)
                    .get()
                    .get();
            return query.toObjects(ChatSession.class);
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to list sessions", e);
            throw new RuntimeException(e);
        }
    }

    // --- Messages ---

    public void saveMessage(ChatMessage message) {
        try {
            // Store messages as a sub-collection of the session
            firestore.collection(SESSIONS_COLLECTION)
                    .document(message.getSessionId())
                    .collection(MESSAGES_COLLECTION)
                    .document(message.getId())
                    .set(message)
                    .get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to save message", e);
            throw new RuntimeException(e);
        }
    }

    public List<ChatMessage> getMessages(String sessionId) {
        try {
            QuerySnapshot query = firestore.collection(SESSIONS_COLLECTION)
                    .document(sessionId)
                    .collection(MESSAGES_COLLECTION)
                    .orderBy("createdAt", Query.Direction.ASCENDING)
                    .get()
                    .get();
            return query.toObjects(ChatMessage.class);
        } catch (InterruptedException | ExecutionException e) {
            log.error("Failed to list messages", e);
            throw new RuntimeException(e);
        }
    }
}
