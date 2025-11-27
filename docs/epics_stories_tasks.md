# DocTalk - Epics, User Stories & Tasks

## Epic 1: Project Initialization & Infrastructure

- [x] **Goal:** Set up the repositories, development environment, and basic cloud connectivity.

## Epic 2: Project Management & Documents (Refined)

**Goal:** Allow users to manage Projects and upload documents to specific project folders.

- **Story 2.1: Project Management (Backend)**
  - [ ] **Task:** Create `Project` entity (id, name, status, gcsPrefix, dataStoreId, engineId).
  - [ ] **Task:** Implement `ProjectRepository` (Firestore) and Service.
  - [ ] **Task:** Implement API `POST /api/projects` (Create) and `GET /api/projects` (List).
- **Story 2.2: Scoped GCS Operations**
  - [ ] **Task:** Update `DocumentService` to accept `projectId`.
  - [ ] **Task:** Update `GET /api/documents/upload-url` to take `projectId` -> path: `projectId/filename`.
  - [ ] **Task:** Update `GET /api/documents` to take `projectId` and filter GCS list by prefix.
- **Story 2.3: Project UI**
  - [ ] **Task:** Create Project Dashboard (List Projects + "New Project" button).
  - [ ] **Task:** Update Sidebar to show active Project context.
  - [ ] **Task:** Update Document Upload/List to use active `projectId`.

## Epic 3: Search Infrastructure Automation (Per Project)

**Goal:** Automate Vertex AI Search provisioning for each new project.

- **Story 3.1: Async Provisioning**
  - [ ] **Task:** Update `SearchInfraService` to accept `projectId`.
  - [ ] **Task:** Implement `provisionProjectResources(projectId)`:
    1. Create Data Store `doctalk-<projectId>` (GCS source `gs://bucket/<projectId>/`).
    2. Create Engine `doctalk-app-<projectId>`.
    3. Update Project status in Firestore.
  - [ ] **Task:** Trigger this service asynchronously upon `POST /api/projects`.

## Epic 4: Prompt Management

**Goal:** Global prompts.

- **Story 4.1: Prompt CRUD**
  - [ ] **Task:** Create `Prompt` entity and Firestore repository.
  - [ ] **Task:** Implement API and UI for managing prompts.

## Epic 5: RAG Chat Experience (Scoped)

**Goal:** Chat within a specific project context.

- **Story 5.1: Scoped RAG**
  - [ ] **Task:** Update `SearchService` to look up the Project's specific `engineId`.
  - [ ] **Task:** Implement Chat API to use that Engine.
- **Story 5.2: Chat UI**
  - [ ] **Task:** Chat Interface scoped to project.
