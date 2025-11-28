'use client';

import { useEffect, useState, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { 
    ChatSession, ChatMessage, 
    createSession, getSessions, getMessages, sendMessage 
} from '@/services/chatService';
import { Prompt, getPrompts } from '@/services/promptService';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Plus, MessageSquare, Send, User, Bot, Loader2, FileText, ChevronRight } from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ChatPage() {
    const { activeProject } = useProjectStore();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedPromptId, setSelectedPromptId] = useState<string>('default');
    
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    
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

    const handleNewChat = () => {
        setActiveSessionId(null);
        setMessages([]);
        setInput('');
    };

    const handleSend = async () => {
        if (!input.trim() || !activeProject) return;

        const userText = input.trim();
        setInput('');
        
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

            // Send Message
            const responseMsg = await sendMessage(sessionId!, userText);
            
            // Replace temp message with real one (though ID doesn't matter much for display)
            // And add AI response
            setMessages(prev => [
                ...prev.filter(m => m.id !== tempUserMsg.id), // Remove temp
                { ...tempUserMsg, id: 'real-' + Date.now(), sessionId: sessionId! }, // Add saved user msg (conceptually)
                responseMsg // Add AI response
            ]);
            
            // Re-fetch messages to ensure everything is synced/ordered correctly from server
            const freshMessages = await getMessages(sessionId!);
            setMessages(freshMessages);

        } catch (error) {
            console.error(error);
            // Revert optimistic update or show error
            alert("Failed to send message.");
        } finally {
            setSending(false);
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
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-800">No Project Selected</h2>
                    <p className="text-gray-500 mt-2">Please select a project from the sidebar to start chatting.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Left Sidebar: Sessions */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
                <div className="p-4 border-b border-gray-100">
                    <Button onClick={handleNewChat} className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> New Chat
                    </Button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {sessions.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 mt-8">No chat history</p>
                    ) : (
                        sessions.map(session => (
                            <button
                                key={session.id}
                                onClick={() => setActiveSessionId(session.id)}
                                className={cn(
                                    "w-full text-left p-3 rounded-lg text-sm transition-all hover:bg-purple-50 group border border-transparent",
                                    activeSessionId === session.id ? "bg-purple-50 border-purple-100 font-medium text-purple-700" : "text-gray-600"
                                )}
                            >
                                <div className="truncate pr-2">{session.title || "New Chat"}</div>
                                <div className="text-[10px] text-gray-400 mt-1">{timeAgo(session.createdAt)}</div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white/50">
                {/* Header */}
                <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <h2 className="font-semibold text-gray-800 truncate">
                            {activeSessionId ? sessions.find(s => s.id === activeSessionId)?.title : 'New Conversation'}
                        </h2>
                        {activeSessionId && <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">History</span>}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">System Instruction:</span>
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
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                                <Bot className="h-8 w-8 text-purple-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">Start a new conversation</p>
                            <p className="text-xs mt-1">Select a system instruction and type your message.</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={cn(
                                    "flex gap-4 max-w-3xl mx-auto",
                                    msg.role === 'USER' ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    msg.role === 'USER' ? "bg-purple-600" : "bg-teal-600"
                                )}>
                                    {msg.role === 'USER' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                                </div>
                                
                                <div className={cn(
                                    "flex flex-col gap-1 min-w-[100px] max-w-[80%]",
                                    msg.role === 'USER' ? "items-end" : "items-start"
                                )}>
                                    <div className={cn(
                                        "p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap",
                                        msg.role === 'USER' 
                                            ? "bg-purple-600 text-white rounded-tr-none" 
                                            : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                                    )}>
                                        {msg.content}
                                    </div>
                                    
                                    {/* Citations */}
                                    {msg.citations && msg.citations.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {msg.citations.map((cite, idx) => (
                                                <a 
                                                    key={idx} 
                                                    href={cite.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors"
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    <span className="truncate max-w-[150px]">{cite.title || 'Source Document'}</span>
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    {sending && (
                        <div className="flex gap-4 max-w-3xl mx-auto animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center shrink-0">
                                <Bot className="h-4 w-4 text-white" />
                            </div>
                            <div className="p-4 rounded-2xl rounded-tl-none bg-white border border-gray-100 shadow-sm w-32 h-10 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-white border-t border-gray-200 shrink-0">
                    <div className="max-w-3xl mx-auto relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={activeSessionId ? "Reply to this conversation..." : "Start a new conversation..."}
                            className="w-full p-4 pr-14 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none min-h-[60px] max-h-[200px] shadow-inner text-sm"
                            rows={1}
                            style={{ minHeight: '60px' }} // Simple auto-height hack or use library
                        />
                        <Button 
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            className="absolute right-2 bottom-2 h-10 w-10 p-0 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="max-w-3xl mx-auto text-center mt-2">
                        <p className="text-[10px] text-gray-400">
                            AI responses are grounded in your project documents. Check citations for accuracy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}