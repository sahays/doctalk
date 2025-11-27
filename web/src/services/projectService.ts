import { API_BASE_URL } from "./documentService";

export interface Project {
    id: string;
    name: string;
    status: 'CREATED' | 'PROVISIONING' | 'READY' | 'FAILED';
    gcsPrefix: string;
    dataStoreId: string;
    engineId: string;
    createdAt: string;
}

export async function createProject(name: string): Promise<Project> {
    const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
}

export async function getProjects(): Promise<Project[]> {
    const response = await fetch(`${API_BASE_URL}/projects`);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
}
