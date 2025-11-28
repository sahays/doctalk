export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface Prompt {
    id: string;
    name: string;
    content: string;
    createdAt: string;
}

export async function createPrompt(name: string, content: string): Promise<Prompt> {
    const response = await fetch(`${API_BASE_URL}/prompts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, content }),
    });
    if (!response.ok) throw new Error('Failed to create prompt');
    return response.json();
}

export async function getPrompts(): Promise<Prompt[]> {
    const response = await fetch(`${API_BASE_URL}/prompts`);
    if (!response.ok) throw new Error('Failed to fetch prompts');
    return response.json();
}

export async function updatePrompt(id: string, name: string, content: string): Promise<Prompt> {
    const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, content }),
    });
    if (!response.ok) throw new Error('Failed to update prompt');
    return response.json();
}

export async function deletePrompt(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete prompt');
}
