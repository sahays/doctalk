# DocTalk - Epics, User Stories & Tasks

## Epic 1: Project Initialization & Infrastructure

- [x] **Goal:** Set up the repositories, development environment, and basic cloud connectivity.

## Epic 2: Project Management & Documents (Refined)

**Goal:** Allow users to manage Projects and upload documents to specific project folders.

- **Story 2.1: Project Management (Backend)**

  - [x] **Task:** Create `Project` entity (id, name, status, gcsPrefix, dataStoreId, engineId).

  - [x] **Task:** Implement `ProjectRepository` (Firestore) and Service.

  - [x] **Task:** Implement API `POST /api/projects` (Create) and `GET /api/projects` (List).

- **Story 2.2: Scoped GCS Operations**

  - [x] **Task:** Update `DocumentService` to accept `projectId`.

  - [x] **Task:** Update `GET /api/documents/upload-url` to take `projectId` -> path: `projectId/filename`.

  - [x] **Task:** Update `GET /api/documents` to take `projectId` and filter GCS list by prefix.
  
  - [x] **Task:** Implement `DELETE /api/documents` to delete file from GCS.

- **Story 2.3: Project UI**

  - [x] **Task:** Create Project Dashboard (List Projects + "New Project" button).

  - [x] **Task:** Update Sidebar to show active Project context.

  - [x] **Task:** Update Document Upload/List to use active `projectId`.
  
  - [x] **Task:** Add "Delete" action to Document List.

## Epic 3: Search Infrastructure Automation (Per Project)

**Goal:** Automate Vertex AI Search provisioning for each new project.

- **Story 3.1: Async Provisioning**
  - [x] **Task:** Update `SearchInfraService` to accept `projectId`.
  - [x] **Task:** Implement `provisionProjectResources(projectId)`.
  - [x] **Task:** Trigger this service asynchronously upon `POST /api/projects` (or manual provision).
- **Story 3.2: Content Indexing & Status**
  - [x] **Task:** Implement `importDocuments(projectId)` in `SearchInfraService` (Real GCS Sync).
  - [x] **Task:** Implement `getDocumentCount(projectId)` to check indexing status.
  - [x] **Task:** Expose `POST /api/projects/{id}/sync` and `GET /api/projects/{id}/status`.
  - [x] **Task:** Update Project UI to show "Indexed Documents: X" and "Sync" button.
  - [x] **Task:** Implement robust status polling (RUNNING/COMPLETED/FAILED) with accurate timestamps.

## Epic 4: System Instruction Prompts

**Goal:** Allow users to define global system instructions (personas) that guide the AI's behavior.

- **Story 4.1: Prompt CRUD**
  - [ ] **Task:** Create `Prompt` entity (id, name, content, isDefault) and Firestore repository.
  - [ ] **Task:** Implement API and UI for managing prompts.
  - [ ] **Task:** Implement logic to retrieve the active/default prompt for use as System Instruction in Chat.

## Epic 5: RAG Chat Experience (Scoped)

**Goal:** Chat within a specific project context.

- **Story 5.1: Scoped RAG**
  - [ ] **Task:** Update `SearchService` to look up the Project's specific `engineId`.
  - [ ] **Task:** Implement Chat API to use that Engine.
- **Story 5.2: Chat UI**
  - [ ] **Task:** Chat Interface scoped to project.
