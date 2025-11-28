export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface ChatSession {
    id: string;
    projectId: string;
    promptId?: string;
    title: string;
    createdAt: string;
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    role: 'USER' | 'MODEL';
    content: string;
    citations?: { uri: string; title: string }[];
    createdAt: string;
}

export async function createSession(projectId: string, promptId?: string): Promise<ChatSession> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, promptId }),
    });
    if (!response.ok) throw new Error('Failed to create session');
    return response.json();
}

export async function getSessions(projectId: string): Promise<ChatSession[]> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions?projectId=${projectId}`);
    if (!response.ok) throw new Error('Failed to fetch sessions');
    return response.json();
}

export async function getMessages(sessionId: string): Promise<ChatMessage[]> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    return response.json();
}

export async function sendMessage(sessionId: string, content: string): Promise<ChatMessage> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error('Failed to send message');
    return response.json();
}
