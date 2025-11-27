# DocTalk - Project Scope & Technical Specification

## 1. Project Overview

**DocTalk** is a Retrieval-Augmented Generation (RAG) application designed to allow support staff to "chat" with a
corpus of Standard Operating Procedures (SOPs) and Knowledge Base (KB) articles.

**Key Concept: Projects** The application is multi-tenant based on "Projects".

- **Project:** A logical container with its own Documents, Search Index, and Chat History.
- **Isolation:**
  - **Storage:** Documents are stored in `gs://bucket/<project-id>/`.
  - **Search:** Each Project has its own dedicated **Vertex AI Search Data Store** and **Engine**.
  - **Chat:** Conversations are bound to a specific Project.
- **Prompts:** Global/Independent (shared across projects).

## 2. Technical Architecture

### 2.1. Stack

- **Frontend:** Next.js (Latest)
  - **UI Library:** shadcn/ui (Tailwind CSS)
  - **State Management:** Zustand
  - **Form Management:** React Hook Form + Zod (Validation)
  - **Icons:** Lucide React
- **Backend:** Java Spring Boot
  - SDKs:
    - `google-cloud-storage` (GCS operations)
    - `google-cloud-discoveryengine` (Vertex AI Search automation & retrieval)
    - `com.google.genai:google-genai` (Vertex AI Gemini API - Latest)
    - `google-cloud-firestore` (Database)
- **Database:** Google Cloud Firestore (Native Mode)
  - Stores: **Projects**, System Prompts, Chat Sessions, Message History.
- **Infrastructure (GCP):**
  - **Identity:** Google Cloud IAM (Service Account Impersonation for local dev).
  - **Storage:** Google Cloud Storage (GCS) - Standard Bucket.
  - **Search/Retrieval:** Vertex AI Search (One Data Store per Project).
  - **LLM:** Vertex AI Gemini API (Target Model: `gemini-3.0-pro` or latest available alias).

### 2.2. Key Workflows

1.  **Project Creation:**
    - User creates a Project (Name).
    - Backend generates `projectId` (GUID).
    - Backend triggers async provisioning of **VAIS Data Store** (`doctalk-<projectId>`) and **Engine**.
2.  **Upload:**
    - User selects active Project.
    - Frontend requests Write-Signed URL for path `gs://bucket/<projectId>/<filename>`.
    - Backend generates URL with prefix.
3.  **Indexing:**
    - Each Project's Data Store is configured to sync from `gs://bucket/<projectId>/`.
4.  **RAG Chat (Streaming):**
    - User enters Chat for a Project.
    - Backend resolves the Project's specific **Search Engine ID**.
    - Backend calls VAIS (`SearchServiceClient`) on that Engine.
    - Backend calls Gemini with context.

## 3. Detailed Scope & Features

### 3.0. Project Management

- **Dashboard:** List all available projects.
- **Create Project:** Form to start a new workspace.
- **Context Switching:** Sidebar/Header allows switching active Project.

### 3.1. Document Management

- **Scoped Upload:** Files are placed in project-specific folders.
- **Scoped List:** Only list files matching `prefix=<projectId>/`.

### 3.2. Automated Search Infrastructure

- **Per-Project Provisioning:**
  - Automates creation of Data Store `doctalk-<projectId>` pointing to `gs://bucket/<projectId>/`.
  - Automates creation of Search App `doctalk-app-<projectId>`.
- **Status Tracking:** Firestore tracks `provisioningStatus` (PROVISIONING, READY, FAILED) for each project.

### 3.3. Prompt Management

- **Prompt Library:** Global prompts available to all projects.

### 3.4. Chat Interface

- **Project-Scoped Chat:** History is stored under `projects/{projectId}/chats/...`.

## 4. Constraints & Assumptions

- **Latency:** Creating a new VAIS Data Store takes time (minutes to hours). The app will handle the "Not Ready" state
  gracefully.
- **Cost:** User is aware of GCS and Vertex AI costs.
- **Security:** MVP assumes internal usage; authenticated via Service Account for backend operations. Frontend assumes
  open access or basic auth (scope dependent).

## 5. Timeline & Milestones

- **Phase 1:** Foundation (Spring Boot Init, Next.js Init, GCS Upload).
- **Phase 2:** Project Management & Search Automation (Per-Project Data Stores).
- **Phase 3:** RAG Implementation (Native SDK + Gemini).
- **Phase 4:** UI Polish (Prompts, Chat UX).
