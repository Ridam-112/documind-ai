import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Send,
  Bot,
  User,
  Copy,
  Check,
  PlusCircle,
  Trash2,
  Sparkles,
  BookOpen,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  Key,
  CheckCircle2,
} from 'lucide-react';
import { Message, SourceCitation } from '../../types';
import { api } from '../../services/api';
import { CitationPill } from './CitationPill';

interface ChatPanelProps {
  documentId: string;
  documentTitle: string;
  onJumpToPage: (pageNumber: number) => void;
}

const SUGGESTED_QUESTIONS = [
  'Summarize this document with key bullet points.',
  'What are the core topics and important findings?',
  'List all numbers, dates, and payment or formula details.',
  'What does this document conclude?',
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  documentId,
  documentTitle,
  onJumpToPage,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  
  // AI Config Modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [aiProvider, setAiProvider] = useState<'mock' | 'gemini' | 'openai' | 'groq' | 'ollama'>('groq');
  const [apiKey, setApiKey] = useState('');
  const [aiModel, setAiModel] = useState('qwen/qwen3.8-27b');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load existing AI settings
  useEffect(() => {
    const fetchAISettings = async () => {
      try {
        const s = await api.settings.getAI();
        if (s.llm_provider === 'groq') {
          setAiProvider('groq');
          setAiModel(s.llm_model || 'qwen/qwen3.8-27b');
        } else if (s.llm_provider === 'ollama') {
          setAiProvider('ollama');
          setAiModel(s.llm_model || 'llama3.2');
        } else if (s.llm_provider === 'gemini') {
          setAiProvider('gemini');
          setAiModel(s.llm_model || 'gemini-1.5-flash');
        } else if (s.llm_provider === 'openai') {
          setAiProvider('openai');
          setAiModel(s.llm_model || 'gpt-4o-mini');
        } else {
          setAiProvider('mock');
        }
      } catch (err) {
        console.error('Failed to load AI settings', err);
      }
    };
    fetchAISettings();
  }, []);

  // Load active or existing conversations for this doc
  useEffect(() => {
    const loadExistingConversation = async () => {
      try {
        const convos = await api.chat.listConversations(documentId);
        if (convos && convos.length > 0) {
          const latest = convos[0];
          setConversationId(latest.id);
          const full = await api.chat.getConversation(latest.id);
          setMessages(full.messages || []);
        } else {
          setMessages([]);
          setConversationId(null);
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      }
    };

    loadExistingConversation();
  }, [documentId]);

  const handleSaveAISettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSuccess(false);

    try {
      const defaultModel =
        aiProvider === 'groq'
          ? 'qwen/qwen3.8-27b'
          : aiProvider === 'ollama'
          ? 'llama3.2'
          : aiProvider === 'gemini'
          ? 'gemini-1.5-flash'
          : aiProvider === 'openai'
          ? 'gpt-4o-mini'
          : 'mock';

      await api.settings.updateAI({
        llm_provider: aiProvider,
        llm_api_key: apiKey,
        llm_model: aiModel.trim() || defaultModel,
      });
      setConfigSuccess(true);
      setTimeout(() => {
        setShowConfigModal(false);
        setConfigSuccess(false);
      }, 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to update AI settings');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || isLoading) return;

    setErrorMessage(null);
    setInputValue('');

    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await api.chat.sendMessage(documentId, text, conversationId || undefined);
      if (!conversationId) {
        setConversationId(response.conversation_id);
      }
      setMessages((prev) => [...prev, response.message]);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to generate response. Please check your AI provider configuration.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setErrorMessage(null);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleDeleteChat = async () => {
    if (!conversationId) return;
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await api.chat.deleteConversation(conversationId);
        handleNewChat();
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to delete conversation');
      }
    }
  };

  const toggleSources = (msgId: string) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\[Page\s*\d+\])/gi);

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none break-words text-slate-800 dark:text-slate-200">
        {parts.map((part, index) => {
          const match = part.match(/\[Page\s*(\d+)\]/i);
          if (match) {
            const pageNum = parseInt(match[1], 10);
            return (
              <CitationPill
                key={index}
                pageNumber={pageNum}
                onClick={onJumpToPage}
              />
            );
          }
          return <ReactMarkdown key={index}>{part}</ReactMarkdown>;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 relative">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0 shadow-xs shadow-brand-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>DocuMind Assistant</span>
              <button
                onClick={() => setShowConfigModal(true)}
                title="Configure AI Provider"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-3xs font-semibold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/70 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span className="capitalize">
                  {aiProvider === 'groq'
                    ? 'Qwen Open Source'
                    : aiProvider === 'ollama'
                    ? 'Ollama (Local)'
                    : aiProvider === 'mock'
                    ? 'Smart Local'
                    : aiProvider}
                </span>
              </button>
            </h3>
            <p className="text-3xs text-slate-400 dark:text-slate-500 truncate">
              Grounded on {documentTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConfigModal(true)}
            title="Configure AI Model & Key"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleNewChat}
            title="Start New Chat"
            className="p-1.5 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </button>
          {conversationId && (
            <button
              onClick={handleDeleteChat}
              title="Delete conversation"
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-500 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              Ask questions about this PDF
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-5">
              Accurate, evidence-backed answers with clickable citations to page numbers.
            </p>

            {/* Quick suggested chips */}
            <div className="w-full space-y-2">
              <p className="text-3xs font-semibold uppercase tracking-wider text-slate-400 text-left mb-1">
                Suggested Prompts
              </p>
              {SUGGESTED_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 bg-slate-50/50 dark:bg-slate-850 hover:bg-brand-50/30 dark:hover:bg-brand-950/30 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{q}</span>
                  <Send className="w-3 h-3 text-slate-400 group-hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            const hasSources = msg.sources && msg.sources.length > 0;
            const isExpanded = expandedSources[msg.id] ?? false;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-semibold ${
                    isUser
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                      : 'bg-brand-500 text-white'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-brand-500 text-white rounded-tr-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-2xs'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div>
                      {renderMessageContent(msg.content)}

                      {/* Source Citations Accordion */}
                      {hasSources && (
                        <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-700/80">
                          <button
                            onClick={() => toggleSources(msg.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>
                              {msg.sources!.length} Source Citation
                              {msg.sources!.length > 1 ? 's' : ''}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 space-y-2">
                              {msg.sources!.map((s, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => onJumpToPage(s.page_number)}
                                  className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 text-xs hover:border-brand-400 transition-colors cursor-pointer group"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                                      Page {s.page_number}
                                    </span>
                                    <span className="text-3xs text-slate-400 group-hover:text-brand-500">
                                      Click to jump
                                    </span>
                                  </div>
                                  <p className="text-slate-600 dark:text-slate-300 italic line-clamp-3">
                                    "{s.source_excerpt}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions toolbar */}
                      <div className="mt-2 flex items-center justify-end gap-2 text-3xs text-slate-400">
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
              <div
                className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
                style={{ animationDelay: '0.15s' }}
              />
              <div
                className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
                style={{ animationDelay: '0.3s' }}
              />
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                Searching document chunks & generating answer...
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Assistant Response Error</p>
              <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2 border border-slate-200 dark:border-slate-700 focus-within:border-brand-500 transition-colors"
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about this document... (Enter to send)"
            disabled={isLoading}
            className="flex-1 max-h-32 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none p-1"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white transition-all shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <p className="text-center text-3xs text-slate-400 dark:text-slate-500 mt-1.5">
          DocuMind AI answers are strictly grounded on the PDF text with page citations.
        </p>
      </div>

      {/* AI Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  AI Model & Key Settings
                </h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAISettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Choose AI Engine
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAiProvider('groq');
                      setAiModel('qwen/qwen3.8-27b');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      aiProvider === 'groq'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 shadow-2xs font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-semibold">
                      <span>🚀 Groq Open-Source</span>
                    </div>
                    <span className="text-3xs font-normal text-slate-400 block mt-0.5">Qwen 27B / GPT-OSS 120B (Ultra Fast)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiProvider('ollama');
                      setAiModel('llama3.2');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      aiProvider === 'ollama'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 shadow-2xs font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-semibold">
                      <span>💻 Ollama Local</span>
                    </div>
                    <span className="text-3xs font-normal text-slate-400 block mt-0.5">100% Free, Offline, No Keys</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiProvider('gemini');
                      setAiModel('gemini-1.5-flash');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      aiProvider === 'gemini'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 shadow-2xs font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-semibold">
                      <span>Google Gemini</span>
                    </div>
                    <span className="text-3xs font-normal text-slate-400 block mt-0.5">Gemini 1.5 Flash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiProvider('openai');
                      setAiModel('gpt-4o-mini');
                    }}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      aiProvider === 'openai'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 shadow-2xs font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-semibold">
                      <span>OpenAI</span>
                    </div>
                    <span className="text-3xs font-normal text-slate-400 block mt-0.5">GPT-4o Mini</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAiProvider('mock')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      aiProvider === 'mock'
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 shadow-2xs font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-semibold">
                      <span>⚡ Smart Local</span>
                    </div>
                    <span className="text-3xs font-normal text-slate-400 block mt-0.5">Extractive Grounding (Zero Setup)</span>
                  </button>
                </div>
              </div>

              {aiProvider === 'ollama' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                    <p className="font-semibold mb-1">100% Free Open-Source Local AI Active</p>
                    <p className="text-2xs text-emerald-700 dark:text-emerald-400">
                      Ollama connects to your machine at <code>http://localhost:11434</code>. No API key is needed. You can run <code>ollama run llama3.2</code> or <code>ollama run mistral</code>.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Local Model Name
                    </label>
                    <input
                      type="text"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      placeholder="llama3.2 or mistral or deepseek-r1"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                </div>
              ) : aiProvider !== 'mock' ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {aiProvider === 'groq'
                        ? 'Groq API Key'
                        : aiProvider === 'gemini'
                        ? 'Google Gemini API Key'
                        : 'OpenAI API Key'}
                    </label>
                    <div className="relative">
                      <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        placeholder={
                          aiProvider === 'groq'
                            ? 'gsk_...'
                            : aiProvider === 'gemini'
                            ? 'AIzaSy...'
                            : 'sk-...'
                        }
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                    <p className="text-3xs text-slate-400 mt-1">
                      {aiProvider === 'groq'
                        ? 'Fastest open-source hosting at console.groq.com'
                        : aiProvider === 'gemini'
                        ? 'Get a free API key at aistudio.google.com'
                        : 'Get your key at platform.openai.com'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-500 font-mono"
                    />
                    {aiProvider === 'groq' && (
                      <p className="text-3xs text-slate-400 mt-1">
                        Recommended: <code>qwen/qwen3.8-27b</code> (Document Q&A champion) or <code>openai/gpt-oss-120b</code> (Reasoning)
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    <strong>Smart Local Mode:</strong> Runs directly from extracted document chunks with zero external API calls and zero setup.
                  </p>
                </div>
              )}

              {configSuccess && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>AI configuration saved and activated!</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-lg transition-colors shadow-xs"
                >
                  {isSavingConfig ? 'Saving...' : 'Save & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
