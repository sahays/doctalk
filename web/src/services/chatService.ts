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

export async function updateSession(sessionId: string, title: string): Promise<ChatSession> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
    });
    if (!response.ok) throw new Error('Failed to update session');
    return response.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete session');
}

export async function streamMessage(
    sessionId: string, 
    content: string, 
    onChunk: (chunk: string) => void,
    onCitations?: (citations: { uri: string; title: string }[]) => void,
    onStatus?: (status: string) => void
): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/stream`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ content }),
    });

    if (!response.ok) throw new Error('Failed to start stream');
    if (!response.body) throw new Error('ReadableStream not supported');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split('\n');
        
        // The last line is potentially incomplete, keep it in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data:')) {
                const data = line.slice(5).trim();
                if (!data) continue;
                
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.status && onStatus) {
                        onStatus(parsed.status);
                    }
                    if (parsed.text) {
                        onChunk(parsed.text);
                    }
                    if (parsed.citations && onCitations) {
                        onCitations(parsed.citations);
                    }
                } catch (e) {
                    console.warn("Failed to parse SSE JSON chunk", data);
                }
            }
        }
    }
}
