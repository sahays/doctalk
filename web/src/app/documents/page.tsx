'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/documents/FileUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { ImportDocumentsDialog } from '@/components/documents/ImportDocumentsDialog';
import { useProjectStore } from '@/store/projectStore';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';

export default function DocumentsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { activeProject } = useProjectStore();

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

    return (
        <div className="min-h-screen bg-slate-50/50">
            <PageHeader 
                title="Documents"
                description={activeProject ? `Project: ${activeProject.name}` : 'Select a project to manage documents'}
                breadcrumbs={
                    <Link href="/projects" className="hover:text-white transition-colors flex items-center gap-1">
                        <ArrowLeft className="h-4 w-4" /> Back to Projects
                    </Link>
                }
            />

            <div className="container mx-auto px-6 -mt-16 pb-12 relative z-20">
                <div className="grid gap-8">
                    {/* Upload Section */}
                    <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800 mb-1">Add Documents</h2>
                                <p className="text-gray-500 text-sm">
                                    Upload files directly or import from Cloud Storage.
                                </p>
                            </div>
                            <ImportDocumentsDialog />
                        </div>
                        <FileUpload onUploadComplete={handleUploadComplete} />
                    </div>

                    {/* List Section */}
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                        <DocumentList refreshTrigger={refreshTrigger} />
                    </div>
                </div>
            </div>
        </div>
    );
}
