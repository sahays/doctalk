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
  - [x] **Task:** Create `Prompt` entity and Firestore repository.
  - [x] **Task:** Implement API (`PromptController`, `Service`) for CRUD operations.
  - [x] **Task:** Implement Frontend UI (`/prompts`) for managing system instructions.
  - [x] **Task:** Update Sidebar to include "System Instructions".

## Epic 5: RAG Chat Experience (Scoped & Persistent)

**Goal:** Chat within a specific project context, with persistent sessions and selectable personas.

- **Story 5.1: Chat Backend (Sessions & Logic)**

  - [x] **Task:** Create `ChatSession` and `ChatMessage` entities and repositories.
  - [x] **Task:** Implement `ChatService` to handle session creation, message persistence, and history retrieval.
  - [x] **Task:** Implement `ChatController` endpoints (Create Session, List Sessions, Get Messages, Send Message).
  - [x] **Task:** Integrate `SearchInfraService` (Data Store ID) and `PromptService` (System Instruction) into the Chat
        generation logic using Gemini API.

- **Story 5.2: Chat UI (Sessions & Persona)**
  - [x] **Task:** Update `ChatPage` layout to include a "Recent Chats" sidebar (Session List).
  - [x] **Task:** Implement "New Chat" flow: User selects a System Instruction (Persona) to start a session.
  - [x] **Task:** Implement Chat Interface: Message history view, Input area, "Thinking" state, and Citation rendering.
  - [x] **Task:** Connect Frontend to Backend APIs for seamless chat experience.

- **Story 5.3: Chat Session Management**
  - [x] **Task:** Backend: Add Rename (Update) and Delete Session endpoints.
  - [x] **Task:** Backend: Change default session title to Date/Time string.
  - [x] **Task:** Frontend: Implement Double-click to Rename session.
  - [x] **Task:** Frontend: Implement Delete Session action.
