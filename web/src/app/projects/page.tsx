'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Folder, Loader2, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createProject, getProjects, Project } from '@/services/projectService';
import { useProjectStore } from '@/store/projectStore';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const projectSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
});

type ProjectForm = z.infer<typeof projectSchema>;

export default function ProjectsPage() {
    const { projects, setProjects, setActiveProject } = useProjectStore();
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const router = useRouter();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectForm>({
        resolver: zodResolver(projectSchema),
    });

    useEffect(() => {
        setLoading(true);
        getProjects()
            .then(setProjects)
            .catch(console.error) // Handle error silently or show toast
            .finally(() => setLoading(false));
    }, [setProjects]);

    const onSubmit = async (data: ProjectForm) => {
        setCreating(true);
        try {
            const newProject = await createProject(data.name);
            setProjects([...projects, newProject]);
            reset();
            setIsCreateOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setCreating(false);
        }
    };

    const handleSelectProject = (project: Project) => {
        setActiveProject(project);
        router.push('/documents');
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-pink-500 to-orange-500 pb-24 pt-12 text-white shadow-lg">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight">Workspace</h1>
                            <p className="mt-2 text-pink-100 opacity-90">Manage your knowledge bases and AI assistants.</p>
                        </div>
                        <Button 
                            onClick={() => setIsCreateOpen(!isCreateOpen)}
                            className="bg-white text-orange-600 hover:bg-white/90 border-0 shadow-lg transition-transform hover:scale-105"
                            size="lg"
                        >
                            {isCreateOpen ? 'Close Form' : 'New Project'}
                            {!isCreateOpen && <Plus className="ml-2 h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 -mt-16">
                
                {/* Create Project Form (Collapsible) */}
                <div className={cn(
                    "mb-8 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300 ease-in-out",
                    isCreateOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 border-0 m-0"
                )}>
                    <div className="p-8">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Create New Project</h2>
                        <p className="text-gray-500 mb-6 text-sm">Give your new workspace a name to get started.</p>
                        <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4 items-start">
                            <div className="flex-1">
                                <input
                                    {...register('name')}
                                    placeholder="e.g., HR Policies 2025"
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    autoFocus
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1 ml-1">{errors.name.message}</p>}
                            </div>
                            <Button type="submit" disabled={creating} size="lg" className="bg-gradient-to-r from-pink-500 to-orange-500 text-white border-0">
                                {creating ? <Loader2 className="animate-spin mr-2" /> : null}
                                Create
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Project Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-white rounded-xl shadow-sm animate-pulse" />
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-12 text-center">
                        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                            <Folder className="h-8 w-8 text-orange-500" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
                        <p className="text-gray-500 mt-1 mb-6">Create your first project to start uploading documents.</p>
                        <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                            Create Project
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => handleSelectProject(project)}
                                className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-xl hover:border-pink-200 transition-all duration-200 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-pink-500 transform group-hover:translate-x-1 transition-transform" />
                                </div>
                                
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn(
                                        "p-3 rounded-xl",
                                        "bg-gradient-to-br from-pink-50 to-orange-50"
                                    )}>
                                        <Folder className="h-6 w-6 text-orange-500" />
                                    </div>
                                    {project.status !== 'CREATED' && (
                                        <span className={cn(
                                            "text-xs font-medium px-2.5 py-0.5 rounded-full",
                                            project.status === 'READY' ? "bg-green-100 text-green-700" :
                                            project.status === 'FAILED' ? "bg-red-100 text-red-700" :
                                            "bg-blue-100 text-blue-700"
                                        )}>
                                            {project.status}
                                        </span>
                                    )}
                                </div>
                                
                                <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-pink-600 transition-colors">
                                    {project.name}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Created {new Date(project.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
