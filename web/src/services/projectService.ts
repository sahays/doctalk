import { API_BASE_URL } from "./documentService";

export interface Project {
    id: string;
    name: string;
    status: 'CREATED' | 'PROVISIONING' | 'READY' | 'FAILED';
    gcsPrefix: string;
    dataStoreId: string;
    engineId: string;
    createdAt: string;
    importStatus?: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    lastIndexedAt?: string;
    storageMode?: 'MANAGED' | 'BYOB';
    bucketName?: string;
    bucketPrefix?: string;
}

export interface CreateProjectRequest {
    name: string;
    storageMode?: 'MANAGED' | 'BYOB';
    bucketName?: string;
    bucketPrefix?: string;
}

export async function createProject(request: CreateProjectRequest): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
}

export async function getProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
}

export async function provisionProject(projectId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/provision`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to start provisioning');
}

export async function syncProject(projectId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/sync`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to start sync');
}

export async function getIndexingStatus(projectId: string): Promise<number> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/indexing-status`);
    if (!response.ok) return 0;
    return response.json();
}
