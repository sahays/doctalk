export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface DocumentSummary {
    name: string;
    contentType: string;
    size: number;
    timeCreated: string;
    updated: string;
}

export async function getDocuments(projectId: string): Promise<DocumentSummary[]> {
    const response = await fetch(`${API_BASE_URL}/documents?projectId=${projectId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch documents');
    }
    return response.json();
}

export async function getUploadUrl(projectId: string, fileName: string, contentType: string): Promise<{ url: string; fileName: string }> {
  const response = await fetch(`${API_BASE_URL}/documents/upload-url?projectId=${projectId}&fileName=${encodeURIComponent(fileName)}&contentType=${encodeURIComponent(contentType)}`);
  if (!response.ok) {
    throw new Error('Failed to get upload URL');
  }
  return response.json();
}

async function uploadFileToGcs(signedUrl: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });
}

export async function uploadFile(projectId: string, file: File, onProgress?: (progress: number) => void) {
    // 1. Get Signed URL
    const { url } = await getUploadUrl(projectId, file.name, file.type);
    
    // 2. Upload to GCS
    await uploadFileToGcs(url, file, onProgress);
}
