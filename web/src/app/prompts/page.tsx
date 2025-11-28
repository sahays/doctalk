'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Loader2, MessageSquare, Terminal, Quote, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';
import { Prompt, getPrompts, createPrompt, updatePrompt, deletePrompt } from '@/services/promptService';
import { cn, timeAgo } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

const promptSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    content: z.string().min(10, 'Instruction content must be at least 10 characters'),
});

type PromptForm = z.infer<typeof promptSchema>;

export default function PromptsPage() {
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PromptForm>({
        resolver: zodResolver(promptSchema),
    });

    const fetchPrompts = async () => {
        setLoading(true);
        try {
            const data = await getPrompts();
            setPrompts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrompts();
    }, []);

    const handleEdit = (prompt: Prompt) => {
        setEditingPrompt(prompt);
        setValue('name', prompt.name);
        setValue('content', prompt.content);
        setIsFormOpen(true);
    };

    const handleCreate = () => {
        setEditingPrompt(null);
        reset();
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this system instruction?")) return;
        try {
            await deletePrompt(id);
            setPrompts(prompts.filter(p => p.id !== id));
        } catch (error) {
            console.error(error);
            alert("Failed to delete prompt");
        }
    };

    const onSubmit = async (data: PromptForm) => {
        setSubmitting(true);
        try {
            if (editingPrompt) {
                const updated = await updatePrompt(editingPrompt.id, data.name, data.content);
                setPrompts(prompts.map(p => p.id === updated.id ? updated : p));
            } else {
                const created = await createPrompt(data.name, data.content);
                setPrompts([created, ...prompts]);
            }
            setIsFormOpen(false);
            reset();
        } catch (error) {
            console.error(error);
            alert("Failed to save prompt");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            <PageHeader 
                title="System Instructions"
                description="Define the personas and behavior instructions for your AI assistants."
                actions={
                    <Button onClick={handleCreate} className="bg-white !text-purple-600 hover:bg-white/90 border-0 shadow-lg" size="lg">
                        New Instruction <Plus className="ml-2 h-5 w-5" />
                    </Button>
                }
            />

            <div className="container mx-auto px-6 -mt-16 relative z-20 pb-12">
                
                {/* Create/Edit Modal */}
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingPrompt ? 'Edit Instruction' : 'Create New Instruction'}</DialogTitle>
                      <DialogDescription>
                        Define how the AI should behave. Be specific about tone, role, and constraints.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Name / Role</label>
                            <input
                                {...register('name')}
                                placeholder="e.g., Senior Legal Advisor"
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                        </div>
                        
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">System Instruction</label>
                            <textarea
                                {...register('content')}
                                rows={8}
                                placeholder="You are an expert legal advisor. Answer questions based ONLY on the provided documents. If the answer is not found, state that clearly. Maintain a formal and professional tone..."
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none font-mono text-sm bg-slate-50"
                            />
                            {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingPrompt ? 'Save Changes' : 'Create Instruction'}
                            </Button>
                        </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-xl shadow-sm animate-pulse" />)}
                    </div>
                ) : prompts.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                            <Terminal className="h-8 w-8 text-purple-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No instructions yet</h3>
                        <p className="text-gray-500 mt-1 mb-6">Create your first system persona to guide the AI's responses.</p>
                        <Button onClick={handleCreate} variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50">
                            Create Instruction
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {prompts.map((prompt) => (
                            <div key={prompt.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-200 flex flex-col overflow-hidden group">
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                                            <MessageSquare className="h-6 w-6 text-purple-600" />
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600" onClick={() => handleEdit(prompt)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-600" onClick={() => handleDelete(prompt.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{prompt.name}</h3>
                                    <div className="relative">
                                        <Quote className="absolute -top-1 -left-1 h-3 w-3 text-gray-300 transform -scale-x-100" />
                                        <p className="text-sm text-gray-600 line-clamp-4 pl-4 italic leading-relaxed">
                                            {prompt.content}
                                        </p>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
                                    <span>Created {timeAgo(prompt.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
