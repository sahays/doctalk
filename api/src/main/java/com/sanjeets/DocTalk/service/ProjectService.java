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

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
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
        return project;
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public Project getProject(String id) {
        return projectRepository.findById(id);
    }
}
