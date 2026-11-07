import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Collection, DocumentItem } from '../types';
import { FolderOpen, Plus, Trash2, FileText, CheckCircle2 } from 'lucide-react';

export const CollectionsPage: React.FC = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = async () => {
    try {
      const [colls, docs] = await Promise.all([
        api.collections.list(),
        api.documents.list(),
      ]);
      setCollections(colls);
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const newColl = await api.collections.create(name, description);
      setCollections([newColl, ...collections]);
      setName('');
      setDescription('');
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this collection?')) {
      try {
        await api.collections.delete(id);
        setCollections(collections.filter(c => c.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleDocInCollection = async (collectionId: string, docId: string, isIncluded: boolean) => {
    try {
      if (isIncluded) {
        await api.collections.removeDocument(collectionId, docId);
      } else {
        await api.collections.addDocument(collectionId, docId);
      }
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Collections
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Group related documents into projects, topics, or research sets.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          {showCreate ? 'Cancel' : 'New Collection'}
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl"
        >
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Collection</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Collection Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q3 Financials, AI Research 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Description (optional)
            </label>
            <textarea
              rows={2}
              placeholder="Short description of this document collection..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-brand-500 text-white font-semibold text-xs hover:bg-brand-600"
          >
            Create
          </button>
        </form>
      )}

      {/* Collection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((coll) => (
          <div
            key={coll.id}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <button
                  onClick={() => handleDelete(coll.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {coll.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                {coll.description || 'No description provided.'}
              </p>

              {/* Documents in collection */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Documents ({coll.document_ids.length})
                </p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {documents.map((d) => {
                    const isIncluded = coll.document_ids.includes(d.id);
                    return (
                      <div
                        key={d.id}
                        onClick={() => handleToggleDocInCollection(coll.id, d.id, isIncluded)}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          isIncluded
                            ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="truncate max-w-[180px]">{d.title}</span>
                        {isIncluded ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                        ) : (
                          <span className="text-2xs text-slate-400">+ Add</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
