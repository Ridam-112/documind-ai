import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { DocumentItem, DocumentPage } from '../types';
import { DocumentViewer } from '../components/viewer/DocumentViewer';
import { ChatPanel } from '../components/chat/ChatPanel';
import {
  ArrowLeft,
  FileText,
  Loader2,
  AlertCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  List,
  Eye,
  AlignLeft,
  ZoomIn,
  ZoomOut,
  Search,
  Download,
  Copy,
  Check,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';

export const DocumentWorkspacePage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPagesSidebar, setShowPagesSidebar] = useState<boolean>(true);

  // Viewer controls state
  const [viewMode, setViewMode] = useState<'text' | 'pdf'>('text');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [currentPageText, setCurrentPageText] = useState<string>('');

  useEffect(() => {
    if (!documentId) return;

    const fetchDoc = async () => {
      try {
        const doc = await api.documents.get(documentId);
        setDocument(doc);
      } catch (err: any) {
        setError(err.message || 'Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoc();
  }, [documentId]);

  const handleJumpToPage = (pageNumber: number) => {
    if (document && pageNumber >= 1 && pageNumber <= document.page_count) {
      setCurrentPage(pageNumber);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (document && currentPage < document.page_count) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 160));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 75));

  const handleCopyPageText = () => {
    if (currentPageText) {
      navigator.clipboard.writeText(currentPageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading document workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Unable to open document
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mb-6">
          {error || 'Document not found or you do not have permission to view it.'}
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const pdfUrl = api.documents.getFileUrl(document.id);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Unified Top Navigation Toolbar */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-4 flex items-center justify-between gap-2 z-20 shrink-0">
        {/* Left: Back + Doc Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Dashboard</span>
          </Link>

          <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <h1
              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-xs md:max-w-md"
              title={document.title}
            >
              {document.title}
            </h1>
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
              {document.page_count} pages
            </span>
          </div>
        </div>

        {/* Center: View Switch + Page Navigation + Zoom */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Segmented View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-medium">
            <button
              onClick={() => setViewMode('text')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                viewMode === 'text'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clean Reader</span>
            </button>
            <button
              onClick={() => setViewMode('pdf')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                viewMode === 'pdf'
                  ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Original PDF</span>
            </button>
          </div>

          {/* Page Selector */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-1.5 py-0.5">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 min-w-14 text-center">
              {currentPage} / {document.page_count || 1}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= document.page_count}
              className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-1 py-0.5">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-3xs font-mono font-semibold text-slate-600 dark:text-slate-300 w-9 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Search + Tools + Toggles */}
        <div className="flex items-center gap-1.5 shrink-0">
          {viewMode === 'text' && (
            <div className="relative hidden lg:flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
              <input
                type="text"
                placeholder="Find in page..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 w-32"
              />
            </div>
          )}

          {viewMode === 'text' && currentPageText && (
            <button
              onClick={handleCopyPageText}
              title="Copy Page Text"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          )}

          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            download={document.original_filename}
            title="Download PDF"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
          </a>

          <button
            onClick={() => setShowPagesSidebar(!showPagesSidebar)}
            className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-colors ${
              showPagesSidebar
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Toggle Page Navigation List"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Pages</span>
          </button>

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isChatOpen
                ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
            title={isChatOpen ? 'Hide AI Assistant' : 'Show AI Assistant'}
          >
            {isChatOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            <span className="hidden sm:inline">{isChatOpen ? 'Hide AI' : 'Show AI'}</span>
          </button>
        </div>
      </header>

      {/* Main 3-Pane Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Pages List */}
        {showPagesSidebar && (
          <aside className="w-48 sm:w-52 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-3xs font-bold uppercase tracking-wider text-slate-400">
                Document Pages ({document.page_count})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {Array.from({ length: document.page_count }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    currentPage === pageNum
                      ? 'bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Page {pageNum}</span>
                  </div>
                  {currentPage === pageNum && (
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                  )}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Center Canvas: Document Viewer Canvas */}
        <div className="flex-1 flex overflow-hidden">
          <DocumentViewer
            document={document}
            currentPage={currentPage}
            viewMode={viewMode}
            zoomLevel={zoomLevel}
            searchQuery={searchQuery}
            onPageTextLoaded={setCurrentPageText}
          />
        </div>

        {/* Right Sidebar: AI Assistant Chat */}
        {isChatOpen && (
          <aside className="w-full sm:w-96 md:w-[420px] border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 shadow-lg z-10">
            <ChatPanel
              documentId={document.id}
              documentTitle={document.title}
              onJumpToPage={handleJumpToPage}
            />
          </aside>
        )}
      </div>
    </div>
  );
};
