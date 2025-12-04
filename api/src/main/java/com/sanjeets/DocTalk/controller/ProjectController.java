package com.sanjeets.DocTalk.controller;

import com.sanjeets.DocTalk.controller.dto.CreateProjectRequest;
import com.sanjeets.DocTalk.model.entity.Project;
import com.sanjeets.DocTalk.service.ProjectService;
import com.sanjeets.DocTalk.service.SearchInfraService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "http://localhost:3000")
public class ProjectController {

    private final ProjectService projectService;
    private final SearchInfraService searchInfraService;

    public ProjectController(ProjectService projectService, SearchInfraService searchInfraService) {
        this.projectService = projectService;
        this.searchInfraService = searchInfraService;
    }

    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody CreateProjectRequest request) {
        Project project = projectService.createProject(request);
        return ResponseEntity.ok(project);
    }

    @GetMapping
    public ResponseEntity<List<Project>> listProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @PostMapping("/{projectId}/provision")
    public ResponseEntity<Void> provisionProject(@PathVariable String projectId) {
        searchInfraService.provisionProject(projectId);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/{projectId}/sync")
    public ResponseEntity<Map<String, String>> syncProject(@PathVariable String projectId) {
        try {
            String opName = projectService.triggerSync(projectId);
            return ResponseEntity.accepted().body(Map.of("operation", opName, "status", "RUNNING"));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage(), "status", "RUNNING"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/operations/{operationName}")
    public ResponseEntity<Map<String, String>> checkOperation(@PathVariable String operationName) {
        // operationName usually contains slashes, need to handle decoding if passed in path
        // For simplicity, we might need to pass it as query param or encode it.
        // Spring handles encoded paths well usually.
        SearchInfraService.ImportStatusResult result = searchInfraService.getImportOperationStatus(operationName);
        return ResponseEntity.ok(Map.of("status", result.status));
    }

    @GetMapping("/{projectId}/indexing-status")
    public ResponseEntity<Long> getIndexingStatus(@PathVariable String projectId) {
        return ResponseEntity.ok(searchInfraService.getDocumentCount(projectId));
    }
}
