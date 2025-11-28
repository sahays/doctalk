package com.sanjeets.DocTalk.service;

import com.sanjeets.DocTalk.model.entity.Project;
import com.sanjeets.DocTalk.model.entity.ProjectStatus;
import com.sanjeets.DocTalk.repository.ProjectRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final SearchInfraService searchInfraService;

    public ProjectService(ProjectRepository projectRepository, SearchInfraService searchInfraService) {
        this.projectRepository = projectRepository;
        this.searchInfraService = searchInfraService;
    }

    public Project createProject(String name) {
        String id = UUID.randomUUID().toString();
        Project project = new Project();
        project.setId(id);
        project.setName(name);
        project.setStatus(ProjectStatus.CREATED);
        project.setGcsPrefix(id + "/"); // Simple prefix strategy
        project.setCreatedAt(Instant.now().toString());
        
        projectRepository.save(project);
        
        // Trigger Async Provisioning
        searchInfraService.provisionProject(project.getId());
        
        return project;
    }

    public List<Project> getAllProjects() {
        List<Project> projects = projectRepository.findAll();
        for (Project project : projects) {
            if ("RUNNING".equals(project.getImportStatus()) && project.getLatestImportOperation() != null) {
                try {
                    SearchInfraService.ImportStatusResult result = searchInfraService.getImportOperationStatus(project.getLatestImportOperation());
                    if (!"RUNNING".equals(result.status)) {
                        project.setImportStatus(result.status);
                        if ("COMPLETED".equals(result.status) && result.completionTime != null) {
                            project.setLastIndexedAt(result.completionTime);
                        }
                        projectRepository.save(project);
                    }
                } catch (Exception e) {
                    // Log but don't fail the list
                    System.err.println("Failed to check status for project " + project.getId());
                }
            }
        }
        return projects;
    }

    public Project getProject(String id) {
        Project project = projectRepository.findById(id);
        if (project != null && "RUNNING".equals(project.getImportStatus()) && project.getLatestImportOperation() != null) {
            // Check if operation finished
            SearchInfraService.ImportStatusResult result = searchInfraService.getImportOperationStatus(project.getLatestImportOperation());
            if (!"RUNNING".equals(result.status)) {
                project.setImportStatus(result.status);
                if ("COMPLETED".equals(result.status) && result.completionTime != null) {
                    project.setLastIndexedAt(result.completionTime);
                }
                projectRepository.save(project);
            }
        }
        return project;
    }

    public String triggerSync(String projectId) {
        Project project = getProject(projectId);
        if (project == null) throw new IllegalArgumentException("Project not found");

        if ("RUNNING".equals(project.getImportStatus())) {
            // Double check in case it finished but we haven't updated yet
            if (project.getLatestImportOperation() != null) {
                SearchInfraService.ImportStatusResult result = searchInfraService.getImportOperationStatus(project.getLatestImportOperation());
                if ("RUNNING".equals(result.status)) {
                    throw new IllegalStateException("Sync already in progress");
                }
            }
        }

        String opName = searchInfraService.importDocuments(project.getId(), project.getDataStoreId(), project.getGcsPrefix());
        project.setLatestImportOperation(opName);
        project.setImportStatus("RUNNING");
        // lastIndexedAt is updated only when the job completes
        projectRepository.save(project);
        return opName;
    }
}
