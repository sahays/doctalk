package com.sanjeets.DocTalk.controller;

import com.sanjeets.DocTalk.model.dto.DocumentSummary;
import com.sanjeets.DocTalk.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URL;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000") // Allow frontend access
public class DocumentController {

    private final DocumentService documentService;

    @GetMapping
    public ResponseEntity<List<DocumentSummary>> listDocuments() {
        return ResponseEntity.ok(documentService.listDocuments());
    }

    @GetMapping("/upload-url")
    public ResponseEntity<Map<String, String>> getUploadUrl(
            @RequestParam("fileName") String fileName,
            @RequestParam("contentType") String contentType) {
        
        URL signedUrl = documentService.generateUploadSignedUrl(fileName, contentType);
        
        return ResponseEntity.ok(Map.of(
            "url", signedUrl.toString(),
            "fileName", fileName
        ));
    }
}
