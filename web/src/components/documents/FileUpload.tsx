'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/services/documentService';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/store/projectStore';

interface FileUploadProps {
  onUploadComplete?: () => void;
}

interface FileStatus {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const { activeProject } = useProjectStore();
  const [files, setFiles] = useState<FileStatus[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: 'pending' as const,
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/html': ['.html', '.htm'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    }
  });

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.file.name !== name));
  };

  const handleUpload = async () => {
    if (!activeProject) {
        alert("Please select a project first.");
        return;
    }

    const pendingFiles = files.filter((f) => f.status === 'pending');

    for (const fileStatus of pendingFiles) {
      setFiles((prev) =>
        prev.map((f) =>
          f.file.name === fileStatus.file.name
            ? { ...f, status: 'uploading' }
            : f
        )
      );

      try {
        await uploadFile(activeProject.id, fileStatus.file, (progress) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.file.name === fileStatus.file.name
                ? { ...f, progress }
                : f
            )
          );
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.file.name === fileStatus.file.name
              ? { ...f, status: 'completed', progress: 100 }
              : f
          )
        );
      } catch (error) {
        console.error(error);
        setFiles((prev) =>
          prev.map((f) =>
            f.file.name === fileStatus.file.name
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          )
        );
      }
    }
    
    if (onUploadComplete) onUploadComplete();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/10" : "border-gray-300 hover:border-primary"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-sm text-gray-600">
          Drag & drop files here, or click to select files
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, HTML, DOCX, PPTX, XLSX, TXT (Max 50MB)
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          {files.map((item) => (
            <div
              key={item.file.name}
              className="flex items-center p-4 bg-white border rounded-lg shadow-sm"
            >
              <FileText className="h-8 w-8 text-blue-500 mr-4" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium truncate">
                    {item.file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.status === 'completed' ? 'Done' : `${Math.round(item.progress)}%`}
                  </span>
                </div>
                <Progress value={item.progress} className="h-2" />
                {item.status === 'error' && (
                  <p className="text-xs text-red-500 mt-1">{item.error}</p>
                )}
              </div>
              <div className="ml-4">
                 {item.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                 ) : item.status === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                 ) : (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(item.file.name)}
                        disabled={item.status === 'uploading'}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                 )}
              </div>
            </div>
          ))}
          
          <div className="flex justify-end">
            <Button onClick={handleUpload} disabled={files.every(f => f.status === 'completed' || f.status === 'uploading')}>
              {files.some(f => f.status === 'uploading') ? 'Uploading...' : 'Upload All'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}