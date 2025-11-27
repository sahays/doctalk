'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/documents/FileUpload';
import { DocumentList } from '@/components/documents/DocumentList';

export default function DocumentsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Document Management</h1>
      
      <div className="grid gap-8">
        <div className="bg-slate-50 p-8 rounded-xl border">
          <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
          <p className="text-gray-500 mb-6">
            Upload PDF, DOCX, or TXT files to add them to the knowledge base.
          </p>
          <FileUpload onUploadComplete={handleUploadComplete} />
        </div>

        <DocumentList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
