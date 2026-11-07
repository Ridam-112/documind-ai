import React from 'react';
import { Bookmark, ExternalLink } from 'lucide-react';

interface CitationPillProps {
  pageNumber: number;
  onClick?: (page: number) => void;
}

export const CitationPill: React.FC<CitationPillProps> = ({ pageNumber, onClick }) => {
  return (
    <button
      onClick={() => onClick?.(pageNumber)}
      className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 mx-1 rounded-md text-xs font-semibold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition-colors shadow-2xs group cursor-pointer"
      title={`Jump to Page ${pageNumber} in document viewer`}
    >
      <Bookmark className="w-3 h-3 text-brand-500 group-hover:scale-110 transition-transform" />
      <span>Page {pageNumber}</span>
      <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
    </button>
  );
};
