'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Cloud, Upload } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { API_BASE_URL } from '@/services/documentService';

export function ImportDocumentsDialog() {
    const { activeProject } = useProjectStore();
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<'GCS' | 'S3'>('GCS');
    const [loading, setLoading] = useState(false);

    // Form States
    const [sourceBucket, setSourceBucket] = useState('');
    const [sourcePrefix, setSourcePrefix] = useState('');
    const [accessKey, setAccessKey] = useState('');
    const [secretKey, setSecretKey] = useState('');

    const handleImport = async () => {
        if (!activeProject) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/projects/${activeProject.id}/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    sourceBucket,
                    sourcePrefix,
                    accessKey,
                    secretKey
                })
            });
            if (res.ok) {
                alert("Import started! Files will appear shortly.");
                setIsOpen(false);
            } else {
                alert("Import failed.");
            }
        } catch (e) {
            console.error(e);
            alert("Error starting import.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Cloud className="h-4 w-4" />
                    Import Bucket
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-background text-foreground border-border">
                <DialogHeader>
                    <DialogTitle>Import Documents from Cloud Storage</DialogTitle>
                </DialogHeader>

                <div className="flex gap-4 border-b border-border mb-4">
                    <button
                        onClick={() => setType('GCS')}
                        className={`pb-2 text-sm font-medium border-b-2 transition-colors ${type === 'GCS' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                    >
                        Google Cloud Storage
                    </button>
                    <button
                        onClick={() => setType('S3')}
                        className={`pb-2 text-sm font-medium border-b-2 transition-colors ${type === 'S3' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                    >
                        Amazon S3
                    </button>
                </div>

                <div className="space-y-4">
                    {type === 'GCS' && (
                        <div className="space-y-4">
                            <div className="p-3 bg-blue-50/50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-md border border-blue-100 dark:border-blue-900">
                                <strong>Requirement:</strong> The backend Service Account must have <code>Storage Object Viewer</code> permission on the source bucket.
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Source Bucket Name</label>
                                <input 
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="e.g. my-source-data"
                                    value={sourceBucket}
                                    onChange={(e) => setSourceBucket(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Path Prefix (Optional)</label>
                                <input 
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="e.g. 2023/documents/"
                                    value={sourcePrefix}
                                    onChange={(e) => setSourcePrefix(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {type === 'S3' && (
                        <div className="space-y-4">
                            <div className="p-3 bg-amber-50/50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm rounded-md border border-amber-100 dark:border-amber-900">
                                <strong>Security Tip:</strong> Do not use your root keys. Create a restricted IAM User.
                            </div>
                            
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">S3 Bucket Name</label>
                                <input 
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="e.g. my-aws-bucket"
                                    value={sourceBucket}
                                    onChange={(e) => setSourceBucket(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium">Path Prefix (Optional)</label>
                                <input 
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder="e.g. exports/"
                                    value={sourcePrefix}
                                    onChange={(e) => setSourcePrefix(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Access Key ID</label>
                                    <input 
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        placeholder="AKIA..."
                                        value={accessKey}
                                        onChange={(e) => setAccessKey(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Secret Access Key</label>
                                    <input 
                                        type="password"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                        placeholder="wJalr..."
                                        value={secretKey}
                                        onChange={(e) => setSecretKey(e.target.value)}
                                    />
                                </div>
                            </div>

                            <details className="text-xs text-muted-foreground cursor-pointer">
                                <summary className="font-medium hover:text-foreground">
                                    View minimal AWS IAM Policy example
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto text-[10px] font-mono leading-relaxed select-all">
{`{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:GetObject"
            ],
            "Resource": [
                "arn:aws:s3:::YOUR_BUCKET_NAME",
                "arn:aws:s3:::YOUR_BUCKET_NAME/*"
            ]
        }
    ]
}`}
                                </pre>
                            </details>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button onClick={handleImport} disabled={loading}>
                            {loading ? "Starting..." : "Start Import"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
