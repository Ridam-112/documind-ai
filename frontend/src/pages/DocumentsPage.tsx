import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { DocumentItem } from '../types';
import { StatusBadge } from '../components/documents/StatusBadge';
import {
  FileText,
  Search,
  Trash2,
  MessageSquare,
  Plus,
  RefreshCw,
  FolderPlus,
} from 'lucide-react';
import { UploadDropzone } from '../components/documents/UploadDropzone';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const fetchDocs = async () => {
    try {
      const data = await api.documents.list(search);
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [search]);

  // Auto-poll if any document is processing
  useEffect(() => {
    const hasProcessing = documents.some(
      (d) =>
        d.processing_status === 'uploading' ||
        d.processing_status === 'queued' ||
        d.processing_status === 'extracting' ||
        d.processing_status === 'chunking' ||
        d.processing_status === 'embedding'
    );

    if (!hasProcessing) return;

    const interval = setInterval(() => {
      fetchDocs();
    }, 2500);

    return () => clearInterval(interval);
  }, [documents]);

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete "${title}"?`)) {
      try {
        await api.documents.delete(id);
        setDocuments(prev => prev.filter(d => d.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            My Documents
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your uploaded PDF files, verify vector processing status, and chat.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            {showUpload ? 'Close Upload' : 'Upload Document'}
          </button>
        </div>
      </div>

      {showUpload && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <UploadDropzone
            onUploadSuccess={(doc) => {
              setDocuments(prev => [doc, ...prev]);
              setShowUpload(false);
            }}
          />
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Filter documents by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500"
        />
      </div>

      {/* Document Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-2xs uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="px-6 py-3.5">Document Title</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Pages</th>
                <th className="px-6 py-3.5">File Size</th>
                <th className="px-6 py-3.5">Uploaded</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading documents...
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="truncate max-w-xs">{doc.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={doc.processing_status} size="sm" />
                    </td>
                    <td className="px-6 py-4">{doc.page_count}</td>
                    <td className="px-6 py-4">{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</td>
                    <td className="px-6 py-4 text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {doc.processing_status === 'ready' && (
                          <Link
                            to={`/documents/${doc.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-medium"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Workspace
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(doc.id, doc.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
