'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/documents/FileUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { useProjectStore } from '@/store/projectStore';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DocumentsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { activeProject } = useProjectStore();

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 -m-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 pb-24 pt-12 text-white shadow-lg px-8">
        <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-4 mb-4 text-blue-100">
                <Link href="/projects" className="hover:text-white transition-colors flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Back to Projects
                </Link>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight">Documents</h1>
                    <p className="mt-2 text-blue-100 opacity-90 font-medium">
                        {activeProject ? `Project: ${activeProject.name}` : 'Select a project to manage documents'}
                    </p>
                </div>
            </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-8 -mt-16 pb-12">
        <div className="grid gap-8">
            {/* Upload Section */}
            <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-2">Upload Files</h2>
                <p className="text-gray-500 mb-6 text-sm">
                    Add PDF, DOCX, or TXT files to your knowledge base.
                </p>
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
