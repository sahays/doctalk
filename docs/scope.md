# DocTalk - Project Scope & Technical Specification

## 1. Project Overview

**DocTalk** is a Retrieval-Augmented Generation (RAG) application designed to allow support staff to "chat" with a
corpus of Standard Operating Procedures (SOPs) and Knowledge Base (KB) articles. The system automates the ingestion of
documents into Google Cloud's Vertex AI Search (VAIS) and uses the Gemini 3 Pro model to generate grounded responses.

## 2. Technical Architecture

### 2.1. Stack

- **Frontend:** Next.js (Latest)
  - **UI Library:** shadcn/ui (Tailwind CSS)
  - **State Management:** Zustand
  - **Form Management:** React Hook Form + Zod (Validation)
  - **Icons:** Lucide React
- **Backend:** Java Spring Boot

* Build Tool: Maven/Gradle
  - SDKs:
    - `google-cloud-storage` (GCS operations)
    - `google-cloud-discoveryengine` (Vertex AI Search automation & retrieval)
    - `com.google.genai:google-genai` (Vertex AI Gemini API - Latest)
    - `google-cloud-firestore` (Database)
* **Database:** Google Cloud Firestore (Native Mode)
  - Stores: System Prompts, Chat Sessions, Message History.
* **Infrastructure (GCP):**
  - **Identity:** Google Cloud IAM (Service Account Impersonation for local dev).
  - **Storage:** Google Cloud Storage (GCS) - Standard Bucket.
  - **Search/Retrieval:** Vertex AI Search (Generic Data Store for unstructured data).
  - **LLM:** Vertex AI Gemini API (Target Model: `gemini-3.0-pro` or latest available alias).

### 2.2. Key Workflows

1.  **Auth:** Local development uses `gcloud auth application-default login --impersonate-service-account...`. The app
    inherits these credentials.
2.  **Upload:** Frontend requests a Write-Signed URL from Backend -> Uploads file directly to GCS.
3.  **Indexing:** Backend detects uploads or user triggers "Sync"; calls Discovery Engine API to create/update Data
    Store.
4.  **RAG Chat (Streaming):**
    - User selects a Prompt (System Instruction).
    - User sends query (Context: specific conversation ID).
    - Backend retrieves conversation history from Firestore.
    - Backend calls VAIS (`SearchServiceClient`) to retrieve context.
    - Backend constructs prompt + Context + History + Query.
    - Backend calls Vertex AI Gemini (`Client`) with streaming enabled.
    - Response is streamed (SSE) to Frontend and asynchronously saved to Firestore.

## 3. Detailed Scope & Features

### 3.1. Document Management

- **Bulk Upload:**
  - Multi-select file picker in UI.
  - Direct-to-GCS upload to minimize server load.
  - Supported formats: PDF, TXT, DOCX, HTML (as supported by VAIS).
- **Document List:**
  - View all files currently in the GCS bucket.
  - Metadata display: Filename, Size, Uploaded At.

### 3.2. Automated Search Infrastructure

- **Provisioning:**
  - App checks for existence of Vertex AI Search Data Store.
  - If missing, automates creation using `Discovery Engine API`.
  - **Specifics:** Creates a Generic Data Store for Unstructured Data (GCS Source).
  - Links GCS bucket as the source.
- **Status Monitoring:**
  - (Optional MVP) Check indexing status.

### 3.3. Prompt Management

- **Prompt Library:**
  - UI to Create, Read, Update, Delete (CRUD) system prompts.
  - _Example:_ "You are a Level 2 Support Agent. Be concise." vs "Explain like I'm 5."
  - **Storage:** Firestore collection `prompts`.
- **Selection:**
  - Dropdown in Chat Interface to switch active persona/prompt.

### 3.4. Chat Interface

- **Modern Streaming UI:**
  - Real-time text streaming (typing effect) similar to Gemini/ChatGPT.
  - Chat history sidebar (list of past conversations).
  - Markdown rendering for Bot responses.
- **Gemini 3 Pro Integration:**
  - Utilizes the high-context window and advanced reasoning of Gemini 3 Pro.
- **Citations:**
  - Visual indicator of which documents were used to generate the answer (Grounding).
- **Persistence:**
  - All chat sessions and messages are stored in Firestore for continuity.

## 4. Constraints & Assumptions

- **Latency:** Creating a new VAIS Data Store takes time (minutes to hours). The app will handle the "Not Ready" state
  gracefully.
- **Cost:** User is aware of GCS and Vertex AI costs.
- **Security:** MVP assumes internal usage; authenticated via Service Account for backend operations. Frontend assumes
  open access or basic auth (scope dependent).

## 5. Timeline & Milestones

- **Phase 1:** Foundation (Spring Boot Init, Next.js Init, GCS Upload).
- **Phase 2:** Search Automation (Generic Search Setup & Integration).
- **Phase 3:** RAG Implementation (Native SDK + Gemini).
- **Phase 4:** UI Polish (Prompts, Chat UX).
