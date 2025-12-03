'use client';

import { useEffect, useState, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { 
    ChatSession, ChatMessage, 
    createSession, getSessions, getMessages, updateSession, deleteSession, streamMessage 
} from '@/services/chatService';
import { Prompt, getPrompts } from '@/services/promptService';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Plus, MessageSquare, Send, User, Bot, Loader2, FileText, ChevronRight, Trash2, Edit2, Check, X, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
    const { activeProject } = useProjectStore();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedPromptId, setSelectedPromptId] = useState<string>('default');
    
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [streamStatus, setStreamStatus] = useState<string | null>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
    // Edit State
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load Sessions & Prompts on Mount/Project Change
    useEffect(() => {
        if (!activeProject) return; 
        
        getSessions(activeProject.id).then(setSessions).catch(console.error);
        getPrompts().then(setPrompts).catch(console.error);
        
        // Reset state
        setActiveSessionId(null);
        setMessages([]);
    }, [activeProject]);

    // Load Messages when Session Changes
    useEffect(() => {
        if (!activeSessionId) {
            setMessages([]);
            return;
        }

        setLoadingHistory(true);
        getMessages(activeSessionId)
            .then(setMessages)
            .catch(console.error)
            .finally(() => setLoadingHistory(false));
    }, [activeSessionId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleRename = async (sessionId: string) => {
        if (!editTitle.trim()) return;
        try {
            const updated = await updateSession(sessionId, editTitle);
            setSessions(prev => prev.map(s => s.id === sessionId ? updated : s));
            setEditingSessionId(null);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this chat?")) return;
        try {
            await deleteSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (activeSessionId === sessionId) {
                setActiveSessionId(null);
                setMessages([]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const startEditing = (e: React.MouseEvent, session: ChatSession) => {
        e.stopPropagation();
        setEditingSessionId(session.id);
        setEditTitle(session.title);
    };

    const handleNewChat = () => {
        setActiveSessionId(null);
        setMessages([]);
        setInput('');
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const handleSend = async () => {
        if (!input.trim() || !activeProject) return;

        const userText = input.trim();
        setInput('');
        setStreamStatus(null);
        
        // Optimistic UI: Add User Message immediately
        const tempUserMsg: ChatMessage = {
            id: 'temp-' + Date.now(),
            sessionId: activeSessionId || 'temp',
            role: 'USER',
            content: userText,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempUserMsg]);
        setSending(true);

        try {
            let sessionId = activeSessionId;

            // Create Session if not exists
            if (!sessionId) {
                const newSession = await createSession(
                    activeProject.id, 
                    selectedPromptId === 'default' ? undefined : selectedPromptId
                );
                setSessions(prev => [newSession, ...prev]);
                setActiveSessionId(newSession.id);
                sessionId = newSession.id;
            }

            // Stream Message
            let aiMessageCreated = false;
            const aiMsgId = 'ai-' + Date.now();

            await streamMessage(
                sessionId!,
                userText,
                (chunk) => {
                    if (!aiMessageCreated) {
                        setSending(false); 
                        setStreamStatus(null);
                        setMessages(prev => [
                            ...prev, 
                            { 
                                id: aiMsgId, 
                                sessionId: sessionId!,
                                role: 'MODEL',
                                content: chunk,
                                createdAt: new Date().toISOString() 
                            }
                        ]);
                        aiMessageCreated = true;
                    } else {
                        setMessages(prev => prev.map(msg => 
                            msg.id === aiMsgId 
                                ? { ...msg, content: msg.content + chunk }
                                : msg
                        ));
                    }
                },
                (citations) => {
                    setMessages(prev => prev.map(msg => 
                        msg.id === aiMsgId 
                            ? { ...msg, citations: citations }
                            : msg
                    ));
                },
                (status) => {
                    setStreamStatus(status);
                }
            );
            
            const freshMessages = await getMessages(sessionId!);
            setMessages(freshMessages);

        } catch (error) {
            console.error(error);
            alert("Failed to send message.");
        } finally {
            setSending(false);
            setStreamStatus(null);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!activeProject) {
        return (
            <div className="flex items-center justify-center h-screen bg-muted/30">
                <div className="text-center p-8 bg-card rounded-xl shadow-sm border border-border">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-foreground">No Project Selected</h2>
                    <p className="text-muted-foreground mt-2">Please select a project from the sidebar to start chatting.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-muted/30 overflow-hidden">
            {/* Left Sidebar: Sessions */}
            <div className="w-80 bg-background border-r border-border flex flex-col shrink-0">
                <div className="p-4 border-b border-border">
                    <Button onClick={handleNewChat} className="w-full justify-start shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> New Chat
                    </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {sessions.length === 0 ? (
                        <p className="text-center text-xs text-muted-foreground mt-8">No chat history</p>
                    ) : (
                        sessions.map(session => (
                            <div
                                key={session.id}
                                onClick={() => !editingSessionId && setActiveSessionId(session.id)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg text-sm transition-all hover:bg-muted group border border-transparent relative flex items-center justify-between cursor-pointer",
                                    activeSessionId === session.id ? "bg-muted border-border" : ""
                                )}
                            >
                                {editingSessionId === session.id ? (
                                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                                        <input 
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="flex-1 min-w-0 bg-background border border-primary rounded px-2 py-1 text-xs outline-none text-foreground"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRename(session.id);
                                                if (e.key === 'Escape') setEditingSessionId(null);
                                            }}
                                        />
                                        <button onClick={() => handleRename(session.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="h-3 w-3" /></button>
                                        <button onClick={() => setEditingSessionId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded"><X className="h-3 w-3" /></button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 min-w-0">
                                            <div 
                                                className={cn("truncate pr-2 font-medium", activeSessionId === session.id ? "text-primary" : "text-foreground")}
                                                onDoubleClick={(e) => startEditing(e, session)}
                                                title="Double-click to rename"
                                            >
                                                {session.title || "New Chat"}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(session.createdAt)}</div>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            <button 
                                                onClick={(e) => startEditing(e, session)}
                                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-md transition-colors"
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </button>
                                            <button 
                                                onClick={(e) => handleDelete(e, session.id)}
                                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md transition-colors"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
                {/* Header */}
                <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h2 className="font-semibold text-foreground truncate">
                            {activeSessionId ? sessions.find(s => s.id === activeSessionId)?.title : 'New Conversation'}
                        </h2>
                        {activeSessionId && <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">History</span>}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">System Instruction:</span>
                        <Select 
                            value={selectedPromptId} 
                            onValueChange={setSelectedPromptId}
                            disabled={!!activeSessionId} // Lock persona once session starts
                        >
                            <SelectTrigger className="w-[200px] h-9 text-xs">
                                <SelectValue placeholder="Default Assistant" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="default">Default Assistant</SelectItem>
                                {prompts.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </header>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Bot className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Start a new conversation</p>
                            <p className="text-xs mt-1">Select a system instruction and type your message.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={cn(
                                    "flex gap-4 max-w-3xl mx-auto group",
                                    msg.role === 'USER' ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    msg.role === 'USER' ? "bg-primary" : "bg-muted"
                                )}>
                                    {msg.role === 'USER' ? <User className="h-4 w-4 text-primary-foreground" /> : <Bot className="h-4 w-4 text-muted-foreground" />}
                                </div>
                                
                                <div className={cn(
                                    "flex flex-col gap-1 min-w-[100px] max-w-[80%]",
                                    msg.role === 'USER' ? "items-end" : "items-start"
                                )}>
                                    <div className={cn(
                                        "p-4 rounded-2xl shadow-sm text-sm leading-relaxed overflow-hidden",
                                        msg.role === 'USER' 
                                            ? "bg-primary text-primary-foreground rounded-tr-none" 
                                            : "bg-card border border-border text-card-foreground rounded-tl-none"
                                    )}>
                                        {msg.role === 'USER' ? (
                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                        ) : (
                                            <ReactMarkdown 
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    // Custom link renderer for citations/footnotes
                                                    a: ({node, ...props}) => (
                                                        <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />
                                                    ),
                                                    // Add styling for code blocks
                                                    code: ({node, className, children, ...props}) => {
                                                        const match = /language-(\w+)/.exec(className || '');
                                                        const isInline = !match && !String(children).includes('\n');
                                                        
                                                        if (!isInline) {
                                                            return (
                                                                <div className="relative my-2">
                                                                    <div className="bg-muted text-muted-foreground p-3 rounded-md overflow-x-auto text-xs">
                                                                        <code className={className} {...props}>
                                                                            {children}
                                                                        </code>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => copyToClipboard(String(children))}
                                                                        className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground bg-background/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    >
                                                                        <Copy className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            );
                                                        }
                                                        
                                                        return (
                                                            <code className="bg-muted px-1 py-0.5 rounded text-red-500 font-mono text-xs" {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    }
                                                }}
                                            >{msg.content}</ReactMarkdown>
                                        )}
                                    </div>
                                    
                                    {/* Citations Badges */}
                                    {msg.citations && msg.citations.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2 px-1">
                                            {msg.citations.map((cite, idx) => (
                                                <a 
                                                    key={idx} 
                                                    href={cite.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[10px] bg-muted text-primary px-2 py-1 rounded-full border border-border hover:bg-muted/80 transition-colors"
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    <span className="truncate max-w-[150px]">{cite.title || 'Source Document'}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Action Footer (Copy, Feedback) */}
                                    {msg.role === 'MODEL' && (
                                        <div className="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => copyToClipboard(msg.content)}
                                                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                                title="Copy full response"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </button>
                                            <div className="h-3 w-px bg-border mx-1"></div>
                                            <button className="p-1 text-muted-foreground hover:text-green-600 hover:bg-muted rounded transition-colors">
                                                <ThumbsUp className="h-3 w-3" />
                                            </button>
                                            <button className="p-1 text-muted-foreground hover:text-red-600 hover:bg-muted rounded transition-colors">
                                                <ThumbsDown className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {sending && !streamStatus && (
                        <div className="flex gap-4 max-w-3xl mx-auto animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="p-4 rounded-2xl rounded-tl-none bg-card border border-border shadow-sm w-32 h-10 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                    {/* Status Indicator */}
                    {streamStatus && (
                         <div className="flex gap-4 max-w-3xl mx-auto">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex items-center p-4">
                                <span className="text-xs text-muted-foreground font-medium animate-pulse uppercase tracking-wide flex items-center gap-2">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    {streamStatus}
                                </span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-background border-t border-border shrink-0">
                    <div className="max-w-3xl mx-auto relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={activeSessionId ? "Reply to this conversation..." : "Start a new conversation..."}
                            className="w-full p-4 pr-14 bg-muted/50 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none min-h-[60px] max-h-[200px] shadow-inner text-sm text-foreground placeholder:text-muted-foreground"
                            rows={1}
                            style={{ minHeight: '60px' }}
                        />
                        <Button 
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            className="absolute right-2 bottom-2 h-10 w-10 p-0 rounded-lg shadow-sm"
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="max-w-3xl mx-auto text-center mt-2">
                        <p className="text-[10px] text-muted-foreground">
                            AI responses are grounded in your project documents. Check citations for accuracy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}