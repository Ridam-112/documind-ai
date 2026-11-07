import React from 'react';
import { ProcessingStatus } from '../../types';
import { CheckCircle2, AlertCircle, Loader2, FileSearch, Split, Cpu } from 'lucide-react';

interface StatusBadgeProps {
  status: ProcessingStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<
    ProcessingStatus,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    ready: {
      label: 'Ready',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    uploading: {
      label: 'Uploading',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    queued: {
      label: 'Queued',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    extracting: {
      label: 'Extracting Pages',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      icon: <FileSearch className="w-3.5 h-3.5 animate-pulse" />,
    },
    chunking: {
      label: 'Chunking Text',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: <Split className="w-3.5 h-3.5 animate-pulse" />,
    },
    embedding: {
      label: 'Generating Vectors',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      icon: <Cpu className="w-3.5 h-3.5 animate-pulse" />,
    },
    failed: {
      label: 'Failed',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
  };

  const current = configs[status] || configs.queued;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${current.bg} ${current.text} ${current.border} ${padding}`}
    >
      {current.icon}
      {current.label}
    </span>
  );
};
