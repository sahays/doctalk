package com.sanjeets.DocTalk.controller;

import com.sanjeets.DocTalk.service.SearchInfraService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/search")
@CrossOrigin(origins = "http://localhost:3000")
public class SearchController {

    private final SearchInfraService searchInfraService;

    public SearchController(SearchInfraService searchInfraService) {
        this.searchInfraService = searchInfraService;
    }

    @PostMapping("/provision")
    public ResponseEntity<String> provisionInfrastructure() {
        // 1. Create Data Store
        searchInfraService.provisionDataStore();
        
        // 2. Create Search Engine (App)
        searchInfraService.createSearchApp();

        return ResponseEntity.ok("Search Infrastructure Provisioning Triggered (Async)");
    }
}
