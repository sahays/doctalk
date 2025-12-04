'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/documents/FileUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { useProjectStore } from '@/store/projectStore';
import { ArrowLeft, Cloud } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/layout/PageHeader';

export default function DocumentsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { activeProject } = useProjectStore();

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const isByob = activeProject?.storageMode === 'BYOB';

    return (
        <div className="min-h-screen bg-slate-50/50">
            <PageHeader
                title="Documents"
                description={activeProject ? `Project: ${activeProject.name}${isByob ? ' (BYOB)' : ''}` : 'Select a project to manage documents'}
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
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-1">
                                {isByob ? 'Manage Documents' : 'Add Documents'}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {isByob
                                    ? 'Upload files to your GCS bucket, then sync to index them.'
                                    : 'Upload files directly to managed storage.'}
                            </p>
                        </div>

                        {isByob ? (
                            <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200 space-y-4">
                                <div className="flex items-start gap-3">
                                    <Cloud className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-medium text-blue-900 mb-2">Using Your Own Bucket</h3>
                                        <p className="text-sm text-blue-800 mb-3">
                                            This project uses <strong className="font-mono">{activeProject.bucketName}</strong>
                                            {activeProject.bucketPrefix && <> at <strong className="font-mono">{activeProject.bucketPrefix}</strong></>}
                                        </p>
                                        <div className="text-sm text-blue-700 space-y-2">
                                            <p><strong>To add documents:</strong></p>
                                            <ol className="list-decimal list-inside space-y-1 ml-2">
                                                <li>Upload files to your bucket using <code className="bg-white px-1 rounded">gsutil</code> or GCS Console</li>
                                                <li>Return to the Projects page and click "Start Indexing Job"</li>
                                                <li>Wait for indexing to complete</li>
                                            </ol>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <FileUpload onUploadComplete={handleUploadComplete} />
                        )}
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
