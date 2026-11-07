import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import {
  FileText,
  Sparkles,
  Search,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Layers,
  BookOpen,
  HelpCircle,
  FolderOpen,
  Cpu,
  Bookmark,
  Bot,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'How does DocuMind AI guarantee accurate page citations?',
      a: 'DocuMind AI uses PyMuPDF to extract text while strictly preserving page boundaries. When your PDF is chunked and stored in PostgreSQL with pgvector, each chunk retains its exact page start and end. The AI assistant references these exact chunks to generate real, clickable page citations.',
    },
    {
      q: 'What happens if a question cannot be answered from the document?',
      a: 'Unlike generic chatbots that hallucinate facts, DocuMind AI is strictly prompted to verify retrieved evidence. If the information is not present in your document, it replies honestly: "I couldn\'t find sufficient information about this in the uploaded document."',
    },
    {
      q: 'Which AI providers are supported?',
      a: 'DocuMind AI features a modular provider abstraction supporting OpenAI (GPT-4o, GPT-4o-mini, text-embedding-3-small) and Google Gemini (Gemini 1.5 Flash, text-embedding-004), fully configurable via environment variables.',
    },
    {
      q: 'Is my document private and secure?',
      a: 'Yes. Every document, chunk, vector embedding, and chat history is strictly scoped to your authenticated account with row-level ownership validation. Uploaded files are securely stored and never exposed across tenants.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,91,255,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,91,255,0.25),rgba(2,6,23,0))]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Tagline Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950/70 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-300 text-xs font-semibold uppercase tracking-wider mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Powered Document Intelligence SaaS</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-950 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none">
            Understand Every Document.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-600">
              Instantly.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload complex PDF documents, extract intelligent insights, and chat with page-accurate citations and verifiable evidence.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-base shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 transition-all"
            >
              Start Testing Now (No Login Required)
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 font-semibold text-base transition-colors"
            >
              Explore Features
            </a>
          </div>

          {/* Proof Badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              100% Grounded Answers
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Clickable Page Citations
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              pgvector Similarity Search
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Zero Hallucination Tolerance
            </span>
          </div>

          {/* Interactive Product Preview Mockup */}
          <div className="mt-16 max-w-5xl mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden text-left">
            {/* Top Bar Window Chrome */}
            <div className="h-10 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              <span className="text-2xs font-mono text-slate-400 dark:text-slate-500">
                DocuMind AI Workspace — Q3_Executive_Financial_Report.pdf
              </span>
              <div className="w-12" />
            </div>

            {/* Split Mockup */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 min-h-[380px]">
              {/* Document side */}
              <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                    <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                      Page 4 of 32
                    </span>
                    <span className="text-2xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium">
                      Active Citation Target
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">
                    Section 3.2: Strategic Growth & Operating Margins
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-serif bg-yellow-50 dark:bg-yellow-950/30 p-2.5 rounded-lg border border-yellow-200 dark:border-yellow-900/60">
                    "The company achieved a 28% year-over-year revenue expansion, driven by cloud adoption and enterprise contract renewals. Operating margins expanded by 340 basis points due to automation efficiencies."
                  </p>
                </div>
                <div className="pt-4 flex items-center justify-between text-2xs text-slate-400">
                  <span>Chunk ID: chk_8841a</span>
                  <span>Tokens: 142 • pgvector Indexed</span>
                </div>
              </div>

              {/* Chat side */}
              <div className="p-6 flex flex-col justify-between bg-white dark:bg-slate-900">
                <div className="space-y-4">
                  {/* User query */}
                  <div className="flex justify-end">
                    <div className="bg-brand-500 text-white rounded-2xl rounded-tr-xs px-3.5 py-2 text-xs font-medium max-w-xs shadow-xs">
                      What drove the operating margin expansion this quarter?
                    </div>
                  </div>

                  {/* Assistant response */}
                  <div className="flex gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-brand-500 text-white flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-xs p-3 text-xs text-slate-800 dark:text-slate-200 space-y-2">
                      <p>
                        The report indicates operating margins expanded by <strong>340 basis points</strong>, primarily driven by <strong>automation efficiencies</strong> and cloud adoption.{' '}
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs font-semibold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-800">
                          <Bookmark className="w-2.5 h-2.5" /> Page 4
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Simulated Input */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-400 border border-slate-200 dark:border-slate-700">
                    Ask a follow-up question...
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
              Engineered For Accuracy
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
              Everything you need to interrogate complex PDFs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-brand-400 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-6">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Clickable Page Citations
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Every factual claim is anchored to verified document pages. Click any citation pill to instantly jump the viewer to the exact source.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-brand-400 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-6">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                pgvector Semantic Search
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Powered by PostgreSQL vector cosine distance indexing. Retrieves only the most relevant document chunks without bloating LLM context.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-brand-400 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Tenant Isolation & Security
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Multi-tenant access control ensures zero cross-user vector retrieval. Sanitized uploads prevent PDF prompt injections and path traversal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
              How It Works
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              From raw PDF to cited answers in 3 steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-md shadow-brand-500/30">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Upload & Ingestion
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                PyMuPDF extracts page text and metadata. The system chunks content with 800-token windows preserving page markers.
              </p>
            </div>

            <div className="p-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-md shadow-brand-500/30">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Vector Indexing
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Embeddings are generated and stored in PostgreSQL with pgvector, enabling ultra-fast cosine similarity retrieval.
              </p>
            </div>

            <div className="p-6">
              <div className="w-12 h-12 mx-auto rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-lg mb-4 shadow-md shadow-brand-500/30">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Ask & Navigate
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Ask natural-language questions and receive grounded responses complete with clickable page citations and evidence excerpts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Use Cases */}
      <section className="py-20 bg-slate-100/70 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
              Target Users
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Built for high-density document workflows
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Students',
                desc: 'Interrogate textbooks, lecture slides, study guides, and research papers with instant summaries.',
              },
              {
                title: 'Researchers',
                desc: 'Synthesize lengthy scientific literature, methodologies, and cross-reference citations effortlessly.',
              },
              {
                title: 'Professionals',
                desc: 'Extract key terms from business reports, legal contracts, compliance filings, and audits.',
              },
              {
                title: 'General Users',
                desc: 'Understand manuals, warranties, and dense documentation without reading hundreds of pages.',
              },
            ].map((uc, i) => (
              <div
                key={i}
                className="p-6 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-750 shadow-xs"
              >
                <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {uc.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {uc.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Answers to technical and product questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronRight
                    className={`w-4 h-4 transform transition-transform ${
                      activeFaq === index ? 'rotate-90 text-brand-500' : 'text-slate-400'
                    }`}
                  />
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-700 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">
            Ready to interact with your documents like never before?
          </h2>
          <p className="text-sm text-indigo-100 mb-8 max-w-xl mx-auto leading-relaxed">
            Create an account in 30 seconds and upload your first document for instant AI intelligence.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-brand-600 font-bold text-sm shadow-xl hover:bg-slate-50 transition-colors"
          >
            Upload Document & Test Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-white">
              DocuMind AI
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} DocuMind AI. Built with FastAPI, PostgreSQL, pgvector and React.
          </p>

          <div className="flex items-center space-x-6 text-xs text-slate-500 dark:text-slate-400">
            <a href="#features" className="hover:text-slate-800 dark:hover:text-white">
              Features
            </a>
            <Link to="/login" className="hover:text-slate-800 dark:hover:text-white">
              Login
            </Link>
            <Link to="/register" className="hover:text-slate-800 dark:hover:text-white">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
