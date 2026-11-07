export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type ProcessingStatus =
  | 'uploading'
  | 'queued'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'ready'
  | 'failed';

export interface DocumentItem {
  id: string;
  user_id: string;
  title: string;
  original_filename: string;
  file_size: number;
  page_count: number;
  mime_type: string;
  processing_status: ProcessingStatus;
  processing_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentPage {
  id: string;
  document_id: string;
  page_number: number;
  extracted_text: string;
}

export interface SourceCitation {
  document_id: string;
  document_title: string;
  page_number: number;
  source_excerpt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  sources?: SourceCitation[];
}

export interface ConversationSummary {
  id: string;
  user_id: string;
  document_id?: string | null;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  document_id?: string | null;
  title: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  document_ids: string[];
}

export interface HealthInfo {
  status: string;
  version: string;
  database: string;
  llm_provider: string;
  llm_model: string;
  llm_key_configured: boolean;
  embedding_provider: string;
  embedding_model: string;
  embedding_key_configured: boolean;
  embedding_dimensions: number;
}
