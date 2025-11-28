'use client';

import { useEffect, useState } from 'react';
import { DocumentSummary, getDocuments, deleteDocument } from '@/services/documentService';
import { FileText, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/store/projectStore';

export function DocumentList({ refreshTrigger }: { refreshTrigger: number }) {
    const { activeProject } = useProjectStore();
    const [documents, setDocuments] = useState<DocumentSummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = async () => {
        if (!activeProject) return;
        
        setLoading(true);
        setError(null);
        try {
            const docs = await getDocuments(activeProject.id);
            setDocuments(docs);
        } catch (err) {
            setError('Failed to load documents');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!activeProject || deleting) return;
        
        if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

        setDeleting(fileName);
        try {
            await deleteDocument(activeProject.id, fileName);
            setDocuments(docs => docs.filter(d => d.name !== fileName));
        } catch (err) {
            console.error("Failed to delete", err);
            alert("Failed to delete document");
        } finally {
            setDeleting(null);
        }
    };

    useEffect(() => {
        if (activeProject) {
            fetchDocuments();
        } else {
            setDocuments([]);
        }
    }, [refreshTrigger, activeProject]);

    if (!activeProject) {
        return <div className="text-center p-8 text-gray-500">Please select a project to view documents.</div>;
    }

    if (loading && documents.length === 0) {
        return <div className="text-center p-8 text-gray-500">Loading documents...</div>;
    }
// ...

    if (error) {
        return (
            <div className="text-center p-8 text-red-500">
                <p>{error}</p>
                <Button variant="outline" onClick={fetchDocuments} className="mt-4">
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Available Documents ({documents.length})</h3>
                <Button variant="ghost" size="sm" onClick={fetchDocuments}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>
            
            <div className="grid gap-4">
                {documents.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500 border rounded-lg bg-slate-50 border-dashed">
                        No documents found. Upload some above.
                    </div>
                ) : (
                    documents.map((doc) => (
                        <div key={doc.name} className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 overflow-hidden flex-1">
                                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                                    <FileText className="h-6 w-6 text-blue-500" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-900 truncate" title={doc.name}>
                                        {doc.name.length > 35 ? doc.name.substring(0, 32) + '...' : doc.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {(doc.size / 1024).toFixed(1)} KB • {doc.contentType}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 ml-4">
                                <div className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">
                                    {new Date(doc.timeCreated).toLocaleDateString()}
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(doc.name)}
                                    disabled={deleting === doc.name}
                                >
                                    {deleting === doc.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
