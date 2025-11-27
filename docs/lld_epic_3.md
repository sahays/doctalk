# Low-Level Design: Epic 3 - Search Infrastructure Automation (Refined)

## 1. Overview

Allow users to manually trigger the provisioning of Vertex AI Search infrastructure for a specific Project. This
decouples project creation from resource provisioning, giving users control over when to initialize the AI capabilities.

## 2. API Design

### 2.1. Provision Endpoint

- **Method:** `POST /api/projects/{projectId}/provision`
- **Controller:** `ProjectController`
- **Behavior:**
  1.  Validate `projectId`.
  2.  Check current status (Allow if `CREATED` or `FAILED`).
  3.  Call `SearchInfraService.provisionProject(projectId)` asynchronously.
  4.  Return `202 Accepted`.

## 3. Service Layer (`SearchInfraService`)

### 3.1. `provisionProject(String projectId)`

- **Annotation:** `@Async`
- **Logic:**
  1.  **Load Project:** Fetch from Firestore.
  2.  **State Transition:** Set `status = PROVISIONING`. Save.
  3.  **Resource Creation:**
      - **Data Store:**
        - ID: `ds-{sanitized_uuid}`
        - Config: Generic Unstructured.
        - **Source:** _Note: Data Source linking (GCS) usually happens via Import APIs or separate linking, not strictly
          at creation time for generic stores, but we will define the `content_config` and then trigger an import._
      - **Engine:**
        - ID: `app-{sanitized_uuid}`
        - Link: `ds-{sanitized_uuid}`
  4.  **Initial Import:**
      - Trigger `importDocuments` for path `gs://{bucket}/{projectId}/**`.
  5.  **State Transition:**
      - Success: Set `status = READY`. Save `dataStoreId`, `engineId`.
      - Failure: Set `status = FAILED`. Log error.

## 4. UI/UX (Frontend)

### 4.1. Project Card Actions

- **State: CREATED / FAILED**
  - **Action:** "Setup Search" Button.
  - **Visual:** Primary Button (e.g., Orange/Pink gradient).
- **State: PROVISIONING**
  - **Action:** Disabled Button / Spinner.
  - **Visual:** "Setting up infrastructure..." (Polled status).
- **State: READY**
  - **Action:** "Chat" / "Documents".
  - **Visual:** Green "Active" indicator.

## 5. Technical Components

- **AsyncConfig:** Enable `@Async` in Spring Boot.
- **GCS Integration:** Ensure the Service Account has permissions to create Data Stores and Engines (Vertex AI Admin
  role).
