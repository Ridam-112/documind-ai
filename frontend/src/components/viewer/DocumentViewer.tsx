import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { api } from '../../services/api';
import { DocumentItem, DocumentPage } from '../../types';

interface DocumentViewerProps {
  document: DocumentItem;
  currentPage: number;
  viewMode: 'text' | 'pdf';
  zoomLevel: number;
  searchQuery: string;
  onPageTextLoaded?: (text: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  currentPage,
  viewMode,
  zoomLevel,
  searchQuery,
  onPageTextLoaded,
}) => {
  const [pageData, setPageData] = useState<DocumentPage | null>(null);
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(false);

  useEffect(() => {
    const fetchPage = async () => {
      if (document.page_count <= 0) return;
      setIsLoadingPage(true);
      try {
        const page = await api.documents.getPage(document.id, currentPage);
        setPageData(page);
        onPageTextLoaded?.(page.extracted_text);
      } catch (err) {
        console.error('Failed to load page text', err);
        setPageData(null);
      } finally {
        setIsLoadingPage(false);
      }
    };

    fetchPage();
  }, [document.id, currentPage, document.page_count]);

  const pdfUrl = api.documents.getFileUrl(document.id);

  const renderSearchHighlighted = (text: string) => {
    if (!searchQuery.trim()) {
      return <ReactMarkdown>{text}</ReactMarkdown>;
    }

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);

    return (
      <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed">
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-slate-900 dark:text-white rounded px-0.5 font-bold">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100/90 dark:bg-slate-950/90 overflow-auto p-4 md:p-8 items-center justify-start">
      {viewMode === 'pdf' ? (
        <div
          className="w-full max-w-5xl h-full min-h-[750px] bg-white dark:bg-slate-900 rounded-2xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-800"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          <iframe
            src={`${pdfUrl}#page=${currentPage}`}
            title={document.title}
            className="w-full h-full min-h-[750px] border-none"
          />
        </div>
      ) : (
        <div
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200/90 dark:border-slate-800 p-8 md:p-14 transition-all my-2"
          style={{ fontSize: `${(zoomLevel / 100) * 1.0}rem` }}
        >
          {/* Header on Paper */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 text-xs">
            <span className="font-bold tracking-wider uppercase text-brand-600 dark:text-brand-400">
              Page {currentPage} of {document.page_count}
            </span>
            <span className="text-3xs text-slate-400 dark:text-slate-500">
              PyMuPDF Structured Layer
            </span>
          </div>

          {isLoadingPage ? (
            <div className="space-y-4 py-8 animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
            </div>
          ) : pageData?.extracted_text ? (
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-100 leading-relaxed font-sans space-y-4">
              {renderSearchHighlighted(pageData.extracted_text)}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-xs">
              No readable text on this page. (Blank page or image-only scanned page).
            </div>
          )}
        </div>
      )}
    </div>
  );
};
