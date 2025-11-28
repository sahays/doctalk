# Low-Level Design: Epic 3 - Search Infrastructure Automation (Refined + Indexing)

## 1. Overview

Allow users to manually trigger provisioning and **Indexing** of documents. Provide visibility into how many documents
are currently indexed in the Vertex AI Search Data Store.

## 2. API Design

### 2.1. Provision Endpoint

- **POST /api/projects/{projectId}/provision**
  - Creates Data Store & Engine.
  - Triggers initial Import.

### 2.2. Sync Endpoint

- **POST /api/projects/{projectId}/sync**
  - **Triggers:** `SearchInfraService.importDocuments(projectId)`.
  - **Use Case:** User uploaded new files and wants to update the index immediately.

### 2.3. Status Endpoint

- **GET /api/projects/{projectId}/indexing-status**
  - **Response:** `{ "indexedCount": 12, "status": "READY" }`
  - **Logic:** Calls `SearchInfraService.getDocumentCount()`.

## 3. Service Layer (`SearchInfraService`)

### 3.1. `importDocuments(String projectId)`

- **Client:** `DocumentServiceClient`.
- **Source:** `gs://{bucket}/{projectId}/*`.
- **Mode:** `INCREMENTAL`.
- **Async:** Yes, returns OperationFuture but method returns void (fire-and-forget for MVP).

### 3.2. `getDocumentCount(String projectId)`

- **Client:** `DocumentServiceClient`.
- **Logic:** List documents in `projects/.../branches/default_branch` and count them.
- **Optimization:** For MVP, simple iteration is fine.

## 4. UI/UX (Frontend)

### 4.1. Project Card Updates

- **Stats:** Show "Indexed Documents: [Count]" badge.
- **Actions:**
  - If `READY`: Show "Sync" button (Refresh icon).
  - Poll `indexing-status` periodically if on dashboard.
