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

## Epic 6: Chat Improvements

**Goal:** Enhance the chat experience with real-time streaming, rich text formatting, and usability features.

- **Story 6.1: Streaming Chat Response**

  - [x] **Task:** Backend: Modify `ChatController` to return `Flux<String>` or `SseEmitter` for streaming.

  - [x] **Task:** Backend: Update `ChatService` to use Gemini's streaming generation API.

  - [x] **Task:** Frontend: Update `chatService.ts` to handle streaming response.

  - [x] **Task:** Frontend: Update Chat UI to render streamed tokens in real-time.

- **Story 6.2: Rich Content & Interaction**

  - [x] **Task:** Frontend: Integrate `react-markdown` for rendering message content.

  - [x] **Task:** Frontend: Add "Copy to Clipboard" icon button for code blocks and messages.

  - [x] **Task:** Frontend: Add Thumbs Up/Down icons for feedback on AI responses.

- **Story 6.3: Citations Handling**

  - [x] **Task:** Frontend: Ensure Markdown renders citations references properly.

  - [x] **Task:** Frontend: Deduplicate citations (show unique links only).

## Epic 7: UI Polish

**Goal:** Modernize the application with responsiveness and theming.

- **Story 7.1: Responsive & Collapsible Layout**

  - [x] **Task:** Implement collapsible Sidebar (Desktop: collapse to icons, Mobile: Drawer).
  - [x] **Task:** Refactor Page Layouts (Grid/Flex) to stack correctly on small screens.
  - [x] **Task:** Ensure touch targets are accessible.

- **Story 7.2: Theming (Dark/Light)**
  - [x] **Task:** Setup `next-themes` provider.
  - [x] **Task:** Update Tailwind config for dark mode classes.
  - [x] **Task:** Add Theme Toggle in Sidebar or Header.
  - [x] **Task:** Ensure all components support dark mode variants.

## Epic 8: Flexible Project Storage Configuration (Revised)

**Goal:** Allow projects to use either managed storage (our bucket) or user-owned GCS buckets (BYOB).

- **Story 8.1: Project Storage Mode**

  - [x] **Task:** Backend: Add `storageMode`, `bucketName`, `bucketPrefix` to Project entity.
  - [x] **Task:** Backend: Update `ProjectService.createProject()` to accept bucket configuration.
  - [x] **Task:** Backend: Update Project API to include storage config in requests/responses.

- **Story 8.2: Bucket-Aware Services**

  - [x] **Task:** Backend: Make `DocumentService` bucket-aware (use project's bucket config).
  - [x] **Task:** Backend: Update `SearchInfraService.importDocuments()` to accept bucket parameter.
  - [x] **Task:** Backend: Use FULL reconciliation for BYOB, INCREMENTAL for Managed mode.

- **Story 8.3: Frontend Storage Selection**

  - [x] **Task:** Frontend: Add storage mode selector to CreateProjectDialog.
  - [x] **Task:** Frontend: Add bucket/prefix inputs for BYOB mode with validation.
  - [x] **Task:** Frontend: Show permission grant instructions after BYOB project creation.
  - [x] **Task:** Frontend: Update Documents page to handle BYOB mode (show instructions vs upload).
  - [x] **Task:** Frontend: Add help text explaining Managed vs BYOB trade-offs.

- **Story 8.4: Cleanup Legacy Import**
  - [x] **Task:** Backend: Remove `ImportController`, `DocumentImportService`, `ImportRequest`.
  - [x] **Task:** Backend: Remove `google-cloud-storage-transfer` dependency.
  - [x] **Task:** Frontend: Remove `ImportDocumentsDialog` component.
  - [x] **Task:** Frontend: Remove import button from Documents page.
