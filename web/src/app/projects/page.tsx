'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Folder, Loader2, Search, ArrowRight, RefreshCw, MoreVertical, FileText, Settings, CheckCircle2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createProject, getProjects, provisionProject, syncProject, getIndexingStatus, Project } from '@/services/projectService';
import { useProjectStore } from '@/store/projectStore';
import { useRouter } from 'next/navigation';
import { cn, timeAgo } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';

const projectSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
});

type ProjectForm = z.infer<typeof projectSchema>;

export default function ProjectsPage() {
    const { projects, setProjects, activeProject, setActiveProject } = useProjectStore();
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [provisioningId, setProvisioningId] = useState<string | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [indexingCounts, setIndexingCounts] = useState<Record<string, number>>({});
    const router = useRouter();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectForm>({
        resolver: zodResolver(projectSchema),
    });

    useEffect(() => {
        setLoading(true);
        getProjects()
            .then(setProjects)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [setProjects]);

    // Polling for status updates (Provisioning OR Syncing)
    useEffect(() => {
        const needsPolling = projects.some(p => 
            p.status === 'PROVISIONING' || p.importStatus === 'RUNNING'
        );
        if (!needsPolling) return;

        const interval = setInterval(() => {
            getProjects()
                .then(setProjects)
                .catch(console.error);
        }, 5000); 

        return () => clearInterval(interval);
    }, [projects, setProjects]);

    // Fetch indexing status for READY projects
    useEffect(() => {
        if (projects.length === 0) return;
        
        projects.forEach(p => {
            if (p.status === 'READY') {
                getIndexingStatus(p.id).then(count => {
                    setIndexingCounts(prev => ({ ...prev, [p.id]: count }));
                });
            }
        });
    }, [projects]);

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

    const handleActivateProject = (project: Project) => {
        setActiveProject(project);
    };

    const handleNavigateDocuments = (project: Project) => {
        setActiveProject(project);
        router.push('/documents');
    };

    const handleProvision = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation(); 
        setProvisioningId(project.id);
        try {
            await provisionProject(project.id);
            setProjects(projects.map(p => 
                p.id === project.id ? { ...p, status: 'PROVISIONING' } : p
            ));
        } catch (error) {
            console.error("Provisioning failed trigger", error);
        } finally {
            setProvisioningId(null);
        }
    };

    const handleSync = async (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        // Optimistic update
        setProjects(projects.map(p => 
            p.id === project.id ? { ...p, importStatus: 'RUNNING' } : p
        ));
        
        try {
            await syncProject(project.id);
            // No need to poll explicitly here, the main useEffect will catch the RUNNING state
        } catch (error) {
            console.error("Sync failed", error);
            // Revert state on error
            setProjects(projects.map(p => 
                p.id === project.id ? { ...p, importStatus: 'FAILED' } : p
            ));
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50">
            <PageHeader 
                title="Workspace"
                description="Manage your knowledge bases and AI assistants."
                actions={
                    <Button 
                        onClick={() => setIsCreateOpen(!isCreateOpen)}
                        className="bg-white !text-purple-600 hover:bg-white/90 border-0 shadow-lg transition-transform hover:scale-105"
                        size="lg"
                    >
                        {isCreateOpen ? 'Close Form' : 'New Project'}
                        {!isCreateOpen && <Plus className="ml-2 h-5 w-5" />}
                    </Button>
                }
            />

            <div className="container mx-auto px-6 -mt-16 relative z-20">
                
                {/* Create Project Form */}
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
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    autoFocus
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1 ml-1">{errors.name.message}</p>}
                            </div>
                            <Button type="submit" disabled={creating} size="lg" className="bg-gradient-to-r from-pink-500 to-purple-500 text-white border-0">
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
                        {projects.map((project) => {
                            const isActive = activeProject?.id === project.id;
                            const isSyncing = project.importStatus === 'RUNNING';
                            const isProvisioning = project.status === 'PROVISIONING';
                            const isProcessing = isSyncing || isProvisioning;
                            
                                                        return (
                            
                                                            <div
                            
                                                                key={project.id}
                            
                                                                className={cn(
                            
                                                                    "group relative overflow-hidden rounded-xl border p-6 transition-all duration-200",
                            
                                                                    isActive 
                            
                                                                        ? "bg-gradient-to-l from-purple-50 via-white via-20% to-white border-purple-200 shadow-md" 
                            
                                                                        : "bg-white border-gray-100 shadow-sm hover:shadow-xl hover:border-pink-200",
                                                                    isProcessing && "opacity-75 pointer-events-none"
                            
                                                                )}
                            
                                                            >
                            
                            
                                                                    {/* Context Menu */}
                                                                    <div className="absolute top-4 right-4 z-10 pointer-events-auto">
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-transparent">
                                                                                    <span className="sr-only">Open menu</span>
                                                                                    <MoreVertical className="h-4 w-4 text-gray-400" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                <DropdownMenuItem onClick={() => handleNavigateDocuments(project)}>
                                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                                    <span>Manage Documents</span>
                                                                                </DropdownMenuItem>
                                                                                
                                                                                {(project.status === 'CREATED' || project.status === 'FAILED') && (
                                                                                    <DropdownMenuItem 
                                                                                        onClick={(e) => handleProvision(e, project)}
                                                                                        disabled={provisioningId === project.id}
                                                                                    >
                                                                                        {provisioningId === project.id ? (
                                                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                                        ) : (
                                                                                            <Settings className="mr-2 h-4 w-4" />
                                                                                        )}
                                                                                        <span>{provisioningId === project.id ? 'Starting...' : 'Setup Search Infra'}</span>
                                                                                    </DropdownMenuItem>
                                                                                )}
                                
                                                                                {project.status === 'READY' && (
                                                                                    <DropdownMenuItem 
                                                                                        onClick={(e) => handleSync(e, project)}
                                                                                        disabled={isSyncing}
                                                                                    >
                                                                                        <RefreshCw className={cn("mr-2 h-4 w-4", isSyncing && "animate-spin")} />
                                                                                        <span>{isSyncing ? 'Indexing...' : 'Start Indexing Job'}</span>
                                                                                    </DropdownMenuItem>
                                                                                )}
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                    
                                                                                                        <div className="flex items-start justify-between mb-4">
                                                                    
                                                                                                            <div className={cn(
                                                                    
                                                                                                                "p-3 rounded-xl",
                                                                    
                                                                                                                isActive ? "bg-white/80" : "bg-gradient-to-br from-pink-50 to-purple-50"
                                                                    
                                                                                                            )}>
                                                                    
                                                                                                                {isProcessing ? <RefreshCw className="h-6 w-6 text-blue-500 animate-spin" /> : <Folder className="h-6 w-6 text-purple-500" />}
                                                                    
                                                                                                            </div>
                                                                    
                                                                    
                                                                        <div className="flex flex-col items-end gap-1 mr-8">
                                                                            {project.status !== 'CREATED' && (
                                                                                <span className={cn(
                                                                                    "text-xs font-medium px-2.5 py-0.5 rounded-full",
                                                                                    project.status === 'READY' && !isSyncing ? "bg-green-100 text-green-700" :
                                                                                    isProcessing ? "bg-blue-100 text-blue-700 animate-pulse" :
                                                                                    "bg-red-100 text-red-700"
                                                                                )}>
                                                                                    {isSyncing ? 'INDEXING' : project.status}
                                                                                </span>
                                                                            )}
                                                                                                                        {project.status === 'READY' && (
                                                                                                                            <div className="flex flex-col items-end">
                                                                                                                                <span className="text-[10px] text-gray-400">
                                                                                                                                    {isSyncing ? 'Syncing documents...' : 
                                                                                                                                    (indexingCounts[project.id] !== undefined ? `${indexingCounts[project.id]} Docs Indexed` : 'Checking status...')}
                                                                                                                                </span>
                                                                                                                                {project.lastIndexedAt && (
                                                                                                                                    <span className="text-[9px] text-gray-500">
                                                                                                                                        Last indexed {timeAgo(project.lastIndexedAt)}
                                                                                                                                    </span>
                                                                                                                                )}
                                                                                                                            </div>
                                                                                                                        )}
                                                                            
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-pink-600 transition-colors">
                                                                        {project.name}
                                                                    </h3>
                                                                    <p className="text-sm text-gray-500 mb-4">
                                                                        Created {new Date(project.createdAt).toLocaleDateString()}
                                                                    </p>
                                
                                                                                                                                            <Button
                                
                                                                                                                                                onClick={(e) => { e.stopPropagation(); handleActivateProject(project); }}
                                                                                                                                                disabled={isProcessing}
                                
                                                                                                                                                className={cn(
                                
                                                                                                                                                    "w-full mt-2 transition-colors",
                                
                                                                                                                                                    isActive 
                                
                                                                                                                                                        ? "bg-white !text-purple-600 border border-purple-200 hover:bg-white/90 shadow-sm" 
                                
                                                                                                                                                        : "bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90 shadow-sm"
                                
                                                                                                                                                )}
                                
                                                                                                                                            >
                                
                                                                                                        
                                
                                                                    
                                                                        {isActive ? (
                                                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                        ) : (
                                                                            <Play className="mr-2 h-4 w-4 fill-current" />
                                                                        )}
                                                                        {isActive ? 'Active Project' : 'Activate Project'}
                                                                    </Button>
                                                                </div>
                                
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}