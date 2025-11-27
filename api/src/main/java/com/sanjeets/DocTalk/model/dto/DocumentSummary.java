package com.sanjeets.DocTalk.model.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentSummary {
    private String name;
    private String contentType;
    private Long size;
    private String timeCreated;
    private String updated;
}
