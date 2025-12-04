# DocTalk

AI-powered document analysis and chat system using Google Vertex AI Search and Gemini.

## Tech Stack

**Backend:** Spring Boot 3.4 (Java 21), Google Cloud Platform **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS
**Infrastructure:** Vertex AI Search, Firestore, Cloud Storage, Gemini 2.5 Pro

## Features

- **Project Management** - Organize documents into isolated projects
- **Document Storage** - Upload PDFs, DOCX, TXT via signed URLs to GCS
- **Flexible Storage** - Use managed storage or Bring Your Own Bucket (BYOB) from GCS
- **RAG Chat** - Context-aware chat with document grounding and citations
- **Search Infrastructure** - Auto-provision Vertex AI Search datastores per project
- **System Instructions** - Customizable AI personas/prompts
- **Real-time Streaming** - Server-sent events for live chat responses
- **Dark Mode** - Responsive UI with theme support

## Setup

### Prerequisites

- Java 21+
- Node.js 18+
- Google Cloud Project with billing enabled
- gcloud CLI authenticated

### GCP Permissions

Your service account needs:

```
roles/firestore.user
roles/storage.admin
roles/discoveryengine.admin
roles/aiplatform.user
```

Enable APIs:

```bash
gcloud services enable \
  firestore.googleapis.com \
  storage.googleapis.com \
  discoveryengine.googleapis.com \
  aiplatform.googleapis.com
```

### Environment Variables

Create `.env` in project root:

```bash
GOOGLE_CLOUD_PROJECT=your-project-id
GCS_BUCKET_NAME=your-bucket-name
GEMINI_API_KEY=your-api-key  # Optional if using Vertex AI
GEMINI_MODEL=gemini-2.5-pro
GCP_LOCATION=us-central1
```

### GCS CORS Configuration

Apply CORS to your bucket:

```bash
gsutil cors set gcs_cors.json gs://your-bucket-name
```

### Run Backend

```bash
cd api
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`

### Run Frontend

```bash
cd web
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## Usage

1. **Create Project** - Set up a new document project (Managed or BYOB)
2. **Upload Documents** - Add files directly or use your external bucket
3. **Provision Search** - Automatically creates Vertex AI datastore
4. **Sync Index** - Import documents into the search index
5. **Create Chat** - Select a system instruction and start chatting
6. **Query Documents** - Ask questions and get cited answers

## Storage Configuration

**Managed Mode:**
- We host your files in our central GCS bucket.
- You upload files directly via the UI.

**BYOB Mode (Bring Your Own Bucket):**
- You provide your own GCS bucket name and optional prefix.
- You manage file uploads using `gsutil` or the GCS Console.
- **Requirement:** Our service account needs `Storage Object Viewer` permission on your bucket.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Next.js   │────▶│  Spring Boot │────▶│  Google Cloud   │
│   Frontend  │     │   REST API   │     │  - Firestore    │
└─────────────┘     └──────────────┘     │  - GCS          │
                                          │  - Vertex AI    │
                                          └─────────────────┘
```

## Project Structure

```
doctalk/
├── api/                    # Spring Boot backend
│   └── src/main/java/     # Controllers, Services, Models
├── web/                    # Next.js frontend
│   ├── src/app/           # App routes
│   └── src/components/    # React components
└── docs/                   # Documentation
```
