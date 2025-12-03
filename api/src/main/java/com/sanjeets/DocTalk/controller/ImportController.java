package com.sanjeets.DocTalk.controller;

import com.sanjeets.DocTalk.controller.dto.ImportRequest;
import com.sanjeets.DocTalk.service.DocumentImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects/{projectId}/import")
@CrossOrigin(origins = "http://localhost:3000") // Allow frontend access
public class ImportController {

    private final DocumentImportService importService;

    public ImportController(DocumentImportService importService) {
        this.importService = importService;
    }

    @PostMapping
    public ResponseEntity<String> importDocuments(@PathVariable String projectId, @RequestBody ImportRequest request) {
        try {
            importService.importDocuments(projectId, request);
            return ResponseEntity.ok("Import started successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Import failed: " + e.getMessage());
        }
    }
}
