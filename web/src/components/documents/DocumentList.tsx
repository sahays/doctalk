'use client';

import { useEffect, useState } from 'react';
import { DocumentSummary, getDocuments } from '@/services/documentService';
import { FileText, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DocumentList({ refreshTrigger }: { refreshTrigger: number }) {
    const [documents, setDocuments] = useState<DocumentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        try {
            const docs = await getDocuments();
            setDocuments(docs);
        } catch (err) {
            setError('Failed to load documents');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [refreshTrigger]);

    if (loading && documents.length === 0) {
        return <div className="text-center p-8 text-gray-500">Loading documents...</div>;
    }

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
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Available Documents ({documents.length})</h3>
                <Button variant="ghost" size="sm" onClick={fetchDocuments}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {documents.length === 0 ? (
                             <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                                    No documents found. Upload some above.
                                </td>
                            </tr>
                        ) : (
                            documents.map((doc) => (
                                <tr key={doc.name}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <FileText className="h-5 w-5 text-gray-400 mr-2" />
                                            <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.contentType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(doc.size / 1024).toFixed(1)} KB</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(doc.timeCreated).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
