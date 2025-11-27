import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project } from '@/services/projectService';

interface ProjectState {
    projects: Project[];
    activeProject: Project | null;
    setProjects: (projects: Project[]) => void;
    setActiveProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectState>()(
    persist(
        (set) => ({
            projects: [],
            activeProject: null,
            setProjects: (projects) => set({ projects }),
            setActiveProject: (activeProject) => set({ activeProject }),
        }),
        {
            name: 'project-storage',
        }
    )
);
