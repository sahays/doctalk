package com.sanjeets.DocTalk.controller;

import com.sanjeets.DocTalk.controller.dto.CreateProjectRequest;
import com.sanjeets.DocTalk.model.entity.Project;
import com.sanjeets.DocTalk.service.ProjectService;
import com.sanjeets.DocTalk.service.SearchInfraService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        Project project = projectService.createProject(request.getName());
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
}
