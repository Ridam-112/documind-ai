import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import { HealthInfo } from '../types';
import {
  Settings,
  Cpu,
  Moon,
  Sun,
  User,
  Shield,
  Key,
  CheckCircle2,
  AlertTriangle,
  Database,
  Layers,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const h = await api.health.check();
        setHealth(h);
      } catch (err) {
        console.error('Failed to load health status', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          Settings & Configuration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review your account details, appearance settings, and AI engine status.
        </p>
      </div>

      {/* Account Settings */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-brand-500" />
          User Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block mb-0.5">Full Name</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block mb-0.5">Email</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-brand-500" /> : <Sun className="w-4 h-4 text-brand-500" />}
            Theme Appearance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch between light and dark modes. Currently: <strong className="capitalize">{theme}</strong>.
          </p>
        </div>

        <button
          onClick={toggleTheme}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors"
        >
          Toggle {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      {/* AI & RAG Engine Status */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-brand-500" />
          AI & Vector Engine Configuration
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Inspecting runtime provider abstractions configured in backend environment variables.
        </p>

        {isLoading ? (
          <div className="h-32 bg-slate-50 dark:bg-slate-800 rounded-xl animate-pulse" />
        ) : health ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">LLM Provider & Model</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="capitalize">{health.llm_provider} ({health.llm_model})</span>
                  {health.llm_provider === 'ollama' ? (
                    <span className="inline-flex items-center gap-1 text-2xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> 100% Local (Free)
                    </span>
                  ) : health.llm_key_configured ? (
                    <span className="inline-flex items-center gap-1 text-2xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Key Active
                    </span>
                  ) : health.llm_provider === 'mock' ? (
                    <span className="inline-flex items-center gap-1 text-2xs text-amber-600 dark:text-amber-400">
                      Mock Provider (Dev)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-2xs text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-3 h-3" /> Key Missing
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Embedding Provider & Dim</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="capitalize">{health.embedding_provider} ({health.embedding_dimensions}d)</span>
                  {health.embedding_key_configured ? (
                    <span className="inline-flex items-center gap-1 text-2xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Key Active
                    </span>
                  ) : health.embedding_provider === 'mock' ? (
                    <span className="inline-flex items-center gap-1 text-2xs text-amber-600 dark:text-amber-400">
                      Mock Provider (Dev)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-2xs text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-3 h-3" /> Key Missing
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Database Connectivity</span>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  <span className="capitalize">{health.database}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Application Version</span>
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand-500" />
                  <span>v{health.version}</span>
                </div>
              </div>
            </div>

            {!health.llm_key_configured && health.llm_provider !== 'mock' && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>AI API Key Setup Required for Production</span>
                </div>
                <p className="leading-relaxed">
                  Your backend is configured for provider <strong>{health.llm_provider}</strong>, but <code>LLM_API_KEY</code> has not been set in <code>backend/.env</code>.
                  To enable live AI generation, open <code>backend/.env</code>, add your key, and restart the backend server.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
