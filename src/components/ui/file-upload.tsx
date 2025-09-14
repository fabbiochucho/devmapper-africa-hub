import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, File, Image } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileUploadProps {
  bucket: 'avatars' | 'documents' | 'project-files';
  folder?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onUploadComplete?: (urls: string[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function FileUpload({
  bucket,
  folder = '',
  accept = 'image/*,application/pdf,text/*',
  multiple = false,
  maxSizeMB = 10,
  onUploadComplete,
  onUploadError,
  className,
  children
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const { uploadFile, uploading, progress } = useFileUpload({
    bucket,
    maxSizeMB,
    folder
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    const urls: string[] = [];
    
    for (const file of selectedFiles) {
      const url = await uploadFile(file);
      if (url) {
        urls.push(url);
      } else {
        onUploadError?.('Failed to upload ' + file.name);
        return;
      }
    }

    setUploadedUrls(urls);
    onUploadComplete?.(urls);
    setSelectedFiles([]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {children || (
          <div className="space-y-2">
            <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to select files or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              Max file size: {maxSizeMB}MB
            </p>
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Selected Files:</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center space-x-2">
                {getFileIcon(file)}
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                Uploading... {progress}%
              </p>
            </div>
          )}

          <Button 
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="w-full"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
          </Button>
        </div>
      )}

      {uploadedUrls.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-green-600">Upload Complete!</h4>
          <div className="text-xs text-muted-foreground">
            {uploadedUrls.length} file(s) uploaded successfully
          </div>
        </div>
      )}
    </div>
  );
}