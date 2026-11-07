import React, { useState, useRef } from 'react';
import { Upload, FileUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { DocumentItem } from '../../types';

interface UploadDropzoneProps {
  onUploadSuccess: (doc: DocumentItem) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setError(null);

    // Validate type
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Only PDF documents are supported at this time.');
      return;
    }

    // Validate size (25MB limit)
    const maxBytes = 25 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError('File exceeds maximum size limit of 25MB.');
      return;
    }

    setIsUploading(true);
    setProgress(20);

    try {
      // Simulate progress while uploading
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 80 ? prev + 15 : prev));
      }, 150);

      const doc = await api.documents.upload(file);
      clearInterval(interval);
      setProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
        onUploadSuccess(doc);
      }, 400);
    } catch (err: any) {
      setIsUploading(false);
      setProgress(0);
      setError(err.message || 'Failed to upload document. Please try again.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-950/20 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-slate-50/50 dark:hover:bg-slate-900'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              isDragging
                ? 'bg-brand-500 text-white'
                : 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400'
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
            ) : (
              <FileUp className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
              {isUploading ? 'Uploading and queuing document...' : 'Upload your PDF document'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Drag & drop your file here, or{' '}
              <span className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
                browse files
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 pt-1">
            <span>PDF files only</span>
            <span>•</span>
            <span>Up to 25 MB</span>
            <span>•</span>
            <span>Text-extractable</span>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="w-full max-w-xs mt-3">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error state alert */}
      {error && (
        <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
