# DocTalk - Epics, User Stories & Tasks

## Epic 1: Project Initialization & Infrastructure

**Goal:** Set up the repositories, development environment, and basic cloud connectivity.

- **Story 1.1: Initialize Projects**
  - [x] **Task:** Create Spring Boot project (Java 21+, Maven/Gradle, Web, GCP dependencies).
  - [x] **Task:** Create Next.js project (TypeScript, Tailwind, ESLint).
  - [x] **Task:** Install & Configure frontend libraries: `shadcn/ui`, `zustand`, `zod`, `react-hook-form`, `lucide-react`.
  - [x] **Task:** Configure `.gitignore` and basic project structure.
- **Story 1.2: Cloud Authentication & Infrastructure**
  - [x] **Task:** Verify `gcloud` local setup with Service Account impersonation.
  - [x] **Task:** Implement Spring Boot configuration to load Google Credentials (ADC).
  - [x] **Task:** Configure Firestore Client bean in Spring Boot.

## Epic 2: Document Management (The Knowledge Base)

**Goal:** Allow users to upload and view documents that will serve as the knowledge source.

- **Story 2.1: GCS Direct Upload (Backend)**
  - [x] **Task:** Implement API `GET /api/documents/upload-url` to generate GCS Write-Signed URLs.
  - [x] **Task:** Configure GCS Bucket CORS to allow uploads from localhost.
- **Story 2.2: File Uploader UI (Frontend)**
  - [x] **Task:** Create a multi-select file input component.
  - [x] **Task:** Implement logic to request Signed URL and `PUT` file to GCS.
  - [x] **Task:** specific UI for upload progress/status.
- **Story 2.3: Document Listing**
  - [x] **Task:** Implement API `GET /api/documents` to list objects in GCS bucket.
  - [x] **Task:** Create UI table/list to display document names and metadata.

## Epic 3: Search Infrastructure Automation (Generic Search)

**Goal:** Programmatically provision and manage Vertex AI Search resources for Generic Search (Unstructured Data).

- **Story 3.1: Data Store Management (Backend)**
  - [ ] **Task:** Implement service using `google-cloud-discoveryengine` library.
  - [ ] **Task:** Logic to check if a Data Store exists for the GCS bucket.
  - [ ] **Task:** Logic to create a new **Unstructured Data Store** (Generic Search) if missing.
- **Story 3.2: Search Engine Creation**
  - [ ] **Task:** Logic to create a Search App (Engine) and link it to the Data Store.
  - [ ] **Task:** Trigger document import/indexing API.

## Epic 4: Prompt Management

**Goal:** Enable switching between different "personas" or instruction sets for the AI.

- **Story 4.1: Prompt CRUD API**
  - [ ] **Task:** Create `Prompt` model/record.
  - [ ] **Task:** Implement `PromptRepository` using Firestore.
  - [ ] **Task:** Expose REST endpoints (`GET`, `POST`, `DELETE`) for prompts.
- **Story 4.2: Prompt UI**
  - [ ] **Task:** Create a settings page or sidebar to manage prompts.
  - [ ] **Task:** Form to add/edit system instructions.

## Epic 5: RAG Chat Experience

**Goal:** The core chat functionality using Gemini 3 Pro and Vertex AI Search with History and Streaming.

- **Story 5.1: Native SDK Integration**
  - [ ] **Task:** specific dependency setup for `com.google.genai:google-genai` (Latest SDK), `google-cloud-discoveryengine`, `google-cloud-firestore`.
  - [ ] **Task:** Implement `SearchService` to query VAIS using `SearchServiceClient`.
  - [ ] **Task:** Implement `GeminiService` to interact with Vertex AI using the new `Client` and `generateContent` stream.
- **Story 5.2: Chat Persistence (Backend)**
  - [ ] **Task:** Design Firestore schema: `sessions` and `messages` sub-collections.
  - [ ] **Task:** Implement service to save User Query and Bot Response (after stream completion).
  - [ ] **Task:** Implement API `GET /api/chat/history` and `GET /api/chat/{sessionId}`.
- **Story 5.3: Chat API (Streaming)**
  - [ ] **Task:** Create `POST /api/chat/stream` endpoint.
  - [ ] **Task:** Implement RAG flow: Retrieve History -> Search -> Augment -> Stream Generate.
  - [ ] **Task:** Stream output using Server-Sent Events (SSE) or similar.
- **Story 5.4: Modern Chat UI**
  - [ ] **Task:** Build Chat Interface with `shadcn/ui` components (ScrollArea, Avatar, etc.).
  - [ ] **Task:** Implement Sidebar for Chat History navigation.
  - [ ] **Task:** Implement Stream reader hook to handle real-time text updates.
  - [ ] **Task:** Render Markdown and citations dynamically.